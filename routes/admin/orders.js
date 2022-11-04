const express = require("express");
const Router = express.Router();

const orderCont = require("../../controllers/adminControllers/orderController");
const { checkAdminSession } = require('../../includes/middlewares');

Router.get("/", checkAdminSession, orderCont.listingPage);

Router.post("/all-orders-datatable", checkAdminSession, orderCont.allOrdersDatatable);

Router.get("/filter/:filter", checkAdminSession, orderCont.listingAccordingFilterPage);

Router.post("/datatable-filter/:filter", checkAdminSession, orderCont.listingAccordingFilterDatatable);

Router.get("/order-detail/:id", checkAdminSession, orderCont.getOrderDetailPage);

Router.post("/order-status-update", checkAdminSession, orderCont.orderStatusUpdate);

module.exports = Router;