const express = require("express");
const Router = express.Router();

const eventCont = require("../../controllers/adminControllers/eventController");
const { checkAdminSession } = require('../../includes/middlewares');

Router.post("/create-event", checkAdminSession, eventCont.createEvents);

module.exports = Router;