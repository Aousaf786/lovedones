const express = require("express");
const Router = express.Router();

const reminderCont = require("../../controllers/adminControllers/reminderController");
const { checkAdminSession } = require('../../includes/middlewares');

Router.get("/", checkAdminSession, reminderCont.listingPage);

Router.post("/all-reminders-datatable", checkAdminSession, reminderCont.allRemindersDatatable);

module.exports = Router;