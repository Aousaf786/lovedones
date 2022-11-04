const express = require("express");
const Router = express.Router();

const userCont = require("../../controllers/adminControllers/userController");
const { checkAdminSession } = require('../../includes/middlewares');

Router.get("/", checkAdminSession, userCont.listingPage);

Router.post("/all-users-datatable", checkAdminSession, userCont.allUsersDatatable);

Router.get("/add-user", checkAdminSession, userCont.addUserPage);

Router.post("/add-user", checkAdminSession, userCont.addUserRequest);

Router.get("/edit-user/:id", checkAdminSession, userCont.editUserPage);

Router.put("/update-user", checkAdminSession, userCont.updateUserRequest);

Router.delete("/delete-user/:id", checkAdminSession, userCont.deleteUserRequest);

Router.get("/filter/:filter", checkAdminSession, userCont.listingAccordingFilterPage);

Router.post("/datatable-filter/:filter", checkAdminSession, userCont.listingAccordingFilterDatatable);

module.exports = Router;