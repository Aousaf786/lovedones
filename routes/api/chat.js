const express = require("express");
const Router = express.Router();

const chatCont = require("../../controllers/apiControllers/chatController");
const { checkApiSession } = require('../../includes/middlewares');

Router.post("/get-service-token", checkApiSession, chatCont.getServiceToken);


module.exports = Router;