const express = require("express");
const Router = express.Router();

const helperCont = require("../../controllers/apiControllers/helperController");
const { checkApiSession } = require('../../includes/middlewares');

Router.post("/image-uploading", checkApiSession, helperCont.imageUploading);


module.exports = Router;