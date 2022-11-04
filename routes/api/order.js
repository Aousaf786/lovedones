const express = require("express");
const Router = express.Router();

const orderCont = require("../../controllers/apiControllers/orderController");
const { checkApiSession } = require('../../includes/middlewares');

Router.post("/get-stripe-intent", checkApiSession, orderCont.createStripePaymentIntent);

Router.post("/stripe-web-hook", orderCont.stripeWebHook);

Router.post("/create-order", checkApiSession, orderCont.createOrder);

Router.post("/order-listing", checkApiSession, orderCont.OrderListing);

Router.post("/order-detail", checkApiSession, orderCont.getOrderDetail);

Router.post("/cancel-order", checkApiSession, orderCont.orderCancel);


module.exports = Router;