const express = require("express");
const Router = express.Router();

const familyCont = require("../../controllers/apiControllers/familyController");
const { checkApiSession, checkSubscriptionStatus } = require('../../includes/middlewares');

Router.post("/get-families-email", [ checkApiSession ], familyCont.getAllFamilyEmails);

Router.post("/update-families-email", [ checkApiSession ], familyCont.updateFamilyEmails);


module.exports = Router;