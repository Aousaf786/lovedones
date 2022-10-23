const TokenService = require('../../includes/twilioServiceToken');

exports.getServiceToken = (req, res) => {
    let user = req.session.user;
    var identity = "user_"+user.id;

    var adminIdentity = "admin_1";
    var channelUniqueName = "chat_1_vs_"+user.id;
    var channelFriendlyName = user.name+" ("+user.email+")";

    var token = TokenService.generate(identity)

    res.json({
        identity: identity,
        token: token.toJwt(),
        admin_identity: adminIdentity,
        channel_unique_name: channelUniqueName,
        channel_friendly_name: channelFriendlyName,
    });
}