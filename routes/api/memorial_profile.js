const express = require("express");
const Router = express.Router();

const memorialProfileCont = require("../../controllers/apiControllers/memorialProfileController");
const { checkApiSession, checkSubscriptionStatus } = require('../../includes/middlewares');

Router.post("/get-my-memorial-profiles", [ checkApiSession ], memorialProfileCont.getAllMyMemorialProfiles);

Router.post("/add-memorial-profile", [ checkApiSession ], memorialProfileCont.addMemorialProfile);

Router.post("/get-memorial-profile-detail", [ checkApiSession ], memorialProfileCont.getMemorialProfileDetail);

Router.post("/search-memorial-profile", [ checkApiSession ], memorialProfileCont.searchMemorialProfile);

module.exports = Router;