const Validator = require('validatorjs');
const dbObj = require("../../includes/connection");
const { returnJson } = require('../../includes/functions');
const TokenService = require('../../includes/twilioServiceToken');


exports.chatInboxPage = (req, res) => {
    var passDataToView = {
        page_title: "My Inbox",
        adminSession: req.session.admin,
        sidebarActive: "Chats",
        childSidebarActive: "",
        breadCrumb: ["Home", "Chats"],
    };
    
    res.render("admin/chats/index", passDataToView);
}

exports.getServiceToken = (req, res) => {
    let user = req.session.admin;
    var identity = "admin_"+user.id;

    var token = TokenService.generate(identity)

    res.json({
        identity: identity,
        token: token.toJwt(),
    });
}