const express = require("express");
const Router = express.Router();

const serviceCont = require("../../controllers/adminControllers/serviceController");
const { checkAdminSession } = require('../../includes/middlewares');

Router.get("/", checkAdminSession, serviceCont.listingPage);

Router.get("/add-service", checkAdminSession, serviceCont.addServicePage);

Router.post("/add-service", checkAdminSession, serviceCont.addServiceRequest);

Router.get("/edit-service/:id", checkAdminSession, serviceCont.editServicePage);

Router.put("/update-service", checkAdminSession, serviceCont.updateServiceRequest);

Router.delete("/delete-service/:id", checkAdminSession, serviceCont.deleteServiceRequest);

module.exports = Router;