const express = require("express");
const Router = express.Router();

const reminderCont = require("../../controllers/apiControllers/reminderController");
const { checkApiSession, checkSubscriptionStatus } = require('../../includes/middlewares');

Router.post("/set-reminder", [ checkApiSession ], reminderCont.setReminder);


module.exports = Router;