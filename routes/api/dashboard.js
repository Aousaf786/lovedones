const express = require("express");
const Router = express.Router();

const dashCont = require("../../controllers/apiControllers/dashboardController");
const { checkApiSession } = require('../../includes/middlewares');

Router.post("/profile-detail", checkApiSession, dashCont.getProfileDetail);

Router.post("/update-profile", checkApiSession, dashCont.updateProfile);

Router.post("/update-additional-info", checkApiSession, dashCont.updateAdditionalInfo);


module.exports = Router;