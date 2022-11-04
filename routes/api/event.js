const express = require("express");
const Router = express.Router();

const eventCont = require("../../controllers/apiControllers/eventController");

Router.post("/get-all-event", eventCont.getAllEvents);

Router.post("/get-event-detail", eventCont.getEventDetail);


module.exports = Router;