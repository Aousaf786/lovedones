const express = require("express");
const Router = express.Router();

const serviceCont = require("../../controllers/apiControllers/serviceController");
const { checkApiSession } = require('../../includes/middlewares');

Router.post("/get-all-services", serviceCont.getAllServices);

Router.post("/get-service-detail", serviceCont.getServiceDetail);


module.exports = Router;