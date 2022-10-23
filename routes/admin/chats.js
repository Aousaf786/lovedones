const express = require("express");
const Router = express.Router();

const dashCont = require("../../controllers/adminControllers/chatController");
const { checkAdminSession } = require('../../includes/middlewares');

Router.get("/", checkAdminSession, dashCont.chatInboxPage);

Router.post("/get-service-token", checkAdminSession, dashCont.getServiceToken);

module.exports = Router;