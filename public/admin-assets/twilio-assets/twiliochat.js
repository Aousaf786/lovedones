var twiliochat = (function() {
    var tc = {};
    var MESSAGES_HISTORY_LIMIT = 1000;
  
    var $identity;
    var $channelList;
    var $inputText;
    var $typingRow;
    var $typingPlaceholder;
    var $sendMsgBtn;
    var channelArr = [];
  
    $(document).ready(function() {
      tc.init();
    });
  
    tc.init = function() {
      tc.$messageList = $('#message-list');
      $channelList = $('#channel-list');
      $inputText = $('#input-text');
      $typingRow = $('#typing-row');
      $typingPlaceholder = $('#typing-placeholder');
      $sendMsgBtn = $("#sendMsgBtn")
      $inputText.on('keypress', handleInputTextKeypress);
      $sendMsgBtn.on('click', handleInputTextClickBtn);

      fetchAccessToken(connectMessagingClient);

      $(document).off().on("click", "#channel-list .chat_list", function(e){
        let selectedChannel = $(this).data("sid");
        if (tc.currentChannel && selectedChannel === tc.currentChannel.sid) {
          return;
        }
        setupChannel(selectedChannel);
      });
    };

    function fetchAccessToken(handler) {
        $.post('/admin/chats/get-service-token', {}, null, 'json')
        .done(function(response) {
            $identity = response.identity;
            handler(response.token);
        })
        .fail(function(error) {
            alert("Failed to fetch the Access Token");
            console.log('Failed to fetch the Access Token with error: ' + error);
        });
    }
    
    function connectMessagingClient(token) {
        // Initialize the Chat messaging client
        Twilio.Chat.Client.create(token).then(function(client) {
        tc.messagingClient = client;
        //tc.loadChannelList();
        tc.messagingClient.on('messageAdded', $.throttle(tc.loadChannelList));
        tc.messagingClient.on('channelAdded', $.throttle(tc.loadChannelList));
        tc.messagingClient.on('tokenExpired', refreshToken);
        });
    }
  
    function refreshToken() {
        fetchAccessToken(setNewToken);
    }
  
    function setNewToken(token) {
        tc.messagingClient.updateToken(token);
    }
    
    tc.loadChannelList = function(handler) {
        if (tc.messagingClient === undefined) {
            alert("Chat client is not initialized");
            console.log('Client is not initialized');
            return;
        }
        tc.messagingClient.getSubscribedChannels().then(function(channels) {
            tc.channelArray = tc.sortChannelByMsgDate(channels.items);
            console.log(tc.channelArray);
            if(tc.channelArray.length > 0){
              addChannel(tc.channelArray).then(function(){
                $channelList.text('');
                channelArr.forEach(function(item){
                  $channelList.append(item);
                });
              });
            } else {
              $channelList.html('<h3>No channel found.</h3>');
            }
            /*if (typeof handler === 'function') {
                handler();
            }*/
        });
    }

    tc.sortChannelByMsgDate = function(channels){
      return channels.sort(function(a, b) {
        /** Sort based on the last message if not, consider the last update of the channel */
        return new Date(b.lastMessage ? b.lastMessage.dateCreated : b.dateUpdated) - new Date(a.lastMessage ? a.lastMessage.dateCreated : a.dateCreated);
      });
    }

    async function channelHtml(channel){
      const msgCount = await channel.getMessagesCount();
      const unreadMsgCount = channel.lastConsumedMessageIndex === null ? msgCount : msgCount - channel.lastConsumedMessageIndex - 1;
      let msgBadgeClass = "";
      if(unreadMsgCount == 0){
        msgBadgeClass = "d-none";
      }
      let activeChatClass = "", chatDate;
      if (tc.currentChannel && channel.sid === tc.currentChannel.sid) {
        activeChatClass = "active_chat";
      }
      chatDate = moment(channel.lastMessage ? channel.lastMessage.dateCreated : channel.dateUpdated).format("LLL");
      let html = `<div class="chat_list `+activeChatClass+`" data-sid=`+channel.sid+`>
                    <div class="chat_people">
                        <div class="chat_img">
                            <img src="/admin-assets/images/profile.png" alt="sunil">
                        </div>
                        <div class="chat_ib">
                            <h5>`+channel.friendlyName+` <span class="chat_date">`+chatDate+`</span></h5>
                            <span class="badge badge-primary `+msgBadgeClass+`">`+unreadMsgCount+`</span>
                            <!--<p>Test, which is a new approach to have all solutions astrology under one roof.</p>-->
                        </div>
                    </div>
                </div>`;
      return html;
    }
  
    async function addChannel(channels, index=0) {

      channelArr[index] = await channelHtml(channels[index]);
      index++;
      return channels.length > index ? addChannel(channels, index) : "";
    }

    function setupChannel(channel) {
      showLoader();
      return leaveCurrentChannel()
        .then(function() {
          return initChannel(channel);
        })
        .then(function(_channel) {
          return joinChannel(_channel);
        })
        .then(initChannelEvents);
    }

    function leaveCurrentChannel() {
      if (tc.currentChannel) {
        tc.currentChannel.removeListener('messageAdded', tc.addMessageToList);
        tc.currentChannel.removeListener('typingStarted', showTypingStarted);
        tc.currentChannel.removeListener('typingEnded', hideTypingStarted);
        return Promise.resolve();
        /*return tc.currentChannel.leave().then(function(leftChannel) {
          console.log('left ' + leftChannel.friendlyName);
          leftChannel.removeListener('messageAdded', tc.addMessageToList);
          leftChannel.removeListener('typingStarted', showTypingStarted);
          leftChannel.removeListener('typingEnded', hideTypingStarted);
        });*/
      } else {
        return Promise.resolve();
      }
    }

    function initChannel(channelSid) {
      console.log('Initialized channel ' + channelSid);
      return tc.messagingClient.getChannelBySid(channelSid);
    }
  
    function joinChannel(_channel) {
      return _channel.join()
        .then(function(joinedChannel) {
          console.log('Joined channel ' + joinedChannel.friendlyName);
          updateChannelUI(_channel);
          
          return joinedChannel;
        })
        .catch(function(err) {
          if (_channel.status == 'joined') {
            updateChannelUI(_channel);
            return _channel;    
          } 
          console.error(
            "Couldn't join channel " + _channel.friendlyName + ' because -> ' + err
          );
        });
    }

    function updateChannelUI(selectedChannel) {
      $("#channel-list .active_chat").removeClass("active_chat");
      $("#channel-list .chat_list[data-sid="+selectedChannel.sid+"]").addClass("active_chat");
      tc.currentChannel = selectedChannel;
      tc.$messageList.text('');
      $typingRow.hide();
      tc.loadMessages();
    }
  
    function initChannelEvents() {
      console.log(tc.currentChannel.friendlyName + ' ready.');
      tc.currentChannel.on('messageAdded', tc.addMessageToList);
      tc.currentChannel.on('typingStarted', showTypingStarted);
      tc.currentChannel.on('typingEnded', hideTypingStarted);
      $inputText.prop('disabled', false).focus();
    }

    tc.loadMessages = function() {
      tc.currentChannel.getMessages(MESSAGES_HISTORY_LIMIT).then(function (messages) {
        messages.items.forEach(tc.addMessageToList);
        
        // show unread messages
        let newestMessageIndex = messages.items.length ? messages.items[messages.items.length - 1].index : 0;
        let lastIndex = tc.currentChannel.lastConsumedMessageIndex;
        /*if (lastIndex && lastIndex !== newestMessageIndex) {
          let $divIndex = $('div[data-index='+ lastIndex + ']');
          let top = $divIndex.position() && $divIndex.position().top;
          $divIndex.addClass('last-read');
          tc.$messageList.scrollTop(top + tc.$messageList.scrollTop());
        }*/
        tc.currentChannel.updateLastConsumedMessageIndex(newestMessageIndex).then(readAllMsgOfChannelUI);

      });
      hideLoader();
      $typingRow.show();
    };

    function msgHtml(msg){
      let chatDate, html;
      chatDate = moment(msg.dateCreated).format("LLL");
      if($identity == msg.author){
        html = `  <div class="outgoing_msg">
                      <div class="sent_msg">
                          <p>`+msg.body+`</p>
                          <span class="time_date">`+chatDate+`</span>
                      </div>
                  </div>`;
      } else {
        html = `<div class="incoming_msg" data-index="`+msg.index+`">
                      <div class="incoming_msg_img">
                          <img src="/admin-assets/images/profile.png" alt="sunil">
                      </div>
                      <div class="received_msg">
                          <div class="received_withd_msg">
                            <p>`+msg.body+`</p>
                            <span class="time_date">`+chatDate+`</span>
                          </div>
                      </div>
                  </div>`;
      }
      return html;
    }

    tc.addMessageToList = function(message) {
      if(message.index > message.channel.lastConsumedMessageIndex){
        message.channel.updateLastConsumedMessageIndex(message.index);
      }
      var rowDiv = msgHtml(message);
  
      tc.$messageList.append(rowDiv);
      scrollToMessageListBottom();
    };
  
    function handleInputTextKeypress(event) {
      if (event.keyCode === 13) {
        tc.currentChannel.sendMessage($(this).val());
        event.preventDefault();
        $(this).val('');
      }
      else {
        notifyTyping();
      }
    }

    function handleInputTextClickBtn(event) {
       event.preventDefault();
       tc.currentChannel.sendMessage($inputText.val());
       $inputText.val('');
    }
  
    var notifyTyping = $.throttle(function() {
      tc.currentChannel.typing();
    }, 1000);
  
    function showTypingStarted(member) {
      $typingPlaceholder.text(member.identity + ' is typing...');
    }
  
    function hideTypingStarted(member) {
      $typingPlaceholder.text('');
    }
  
    function scrollToMessageListBottom() {
      tc.$messageList.scrollTop(tc.$messageList[0].scrollHeight);
    }

    function readAllMsgOfChannelUI(){
      let channelId = tc.currentChannel.sid;
      $("[data-sid="+channelId+"]").find(".badge").hide();
    }
  
    return tc;
  })();