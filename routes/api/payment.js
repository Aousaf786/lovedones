const express = require("express");
const Router = express.Router();

const paymentCont = require("../../controllers/apiControllers/paymentController");
const { checkApiSession } = require('../../includes/middlewares');

Router.post("/update-android-inapp-purchase", checkApiSession, paymentCont.androidInAppPurchasePaymentValidate);

Router.post("/webhook-android-inapp-purchase", paymentCont.androidInAppPurchaseWebhook);

Router.post("/update-ios-inapp-purchase", checkApiSession, paymentCont.iosInAppPurchasePaymentValidate);


module.exports = Router;