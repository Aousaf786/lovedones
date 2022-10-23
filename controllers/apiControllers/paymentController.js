const Validator = require('validatorjs');
const dbObj = require("../../includes/connection");
const { returnApiJson } = require('../../includes/functions');
const Verifier = require('google-play-billing-validator');
const moment = require("moment-timezone");

const androidInAppJsonCred = require('../pc-api-android-inapp-purchase-160-2a6f6076e54f.json');

exports.androidInAppPurchasePaymentValidate = (req, res) => {
    let reqData = req.body;
    let rules = {
        order_id: 'required',
        product_id: 'required',
        purchase_token: 'required',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        let userData = req.session.user;
        let androidInAppOptions = {
            email: androidInAppJsonCred.client_email,
            key: androidInAppJsonCred.private_key
        }
        let androidVerifier = new Verifier(androidInAppOptions);
        let androidReceipt = {
            packageName: "com.connaughttechnologies.lovedonce",
            productId: reqData.product_id,
            purchaseToken: reqData.purchase_token
        }
        androidVerifier.verifySub(androidReceipt)
        .then((response) => {
            if(response.isSuccessful){
                //let startMillis = response.payload.startTimeMillis;
                //startMillis = moment(startMillis, "x").format("YYYY-MM-DD HH:mm:ss");
                let expiryMillis = response.payload.expiryTimeMillis;
                expiryMillis = moment(expiryMillis, "x").format("YYYY-MM-DD HH:mm:ss");
                let packageAmount = response.payload.priceAmountMicros/1000000;

                dbObj.selectRow("subscription_histories", "id, status", { purchase_token: reqData.purchase_token, user_id: userData.id }).then(async (data) => {
                    if (data.counts > 0) {
                        dbObj.update("subscription_histories", { "status": 1, "purchase_price": packageAmount, "purchase_expiry_date": expiryMillis }, { "id": data.records.id });
                        dbObj.update("users", { "subscription_status": 1, "subscription_package": reqData.product_id }, { "id": userData.id });
                        returnApiJson(res, 1, "Subscription subscribed successfully");
                    } else {
                        dbObj.insert("subscription_histories", {user_id: userData.id, order_id: reqData.order_id, product_id: reqData.product_id, purchase_token: reqData.purchase_token, purchase_expiry_date: expiryMillis, purchase_price: packageAmount, platform: "Android"}).then((insertData) => {
                            if (insertData.response) {
                                dbObj.update("users", { "subscription_status": 1, "subscription_package": reqData.product_id }, { "id": userData.id });
                                returnApiJson(res, 1, "Subscription subscribed successfully");
                            } else {
                                returnApiJson(res, 0, "Something error in subscription validation");
                            }
                        });
                    }
                });
            } else {
                returnApiJson(res, 0, "Something error in subscription validation");
            }
        })
        .catch(function(error) {
            console.log(error);
            returnApiJson(res, 0, "Something error in subscription validation");
        })
    }
}

exports.androidInAppPurchaseWebhook = (req, res) => {
    const message = req.body ? req.body.message : null;
  
    if (message) {
      const buffer = Buffer.from(message.data, 'base64');
      let data = buffer ? buffer.toString() : null;
      data = JSON.parse(data); 
      if(data.subscriptionNotification && data.subscriptionNotification.purchaseToken){
        // https://developer.android.com/google/play/billing/rtdn-reference#sub
        let subscribeCodes = [1, 2, 4, 7];
        let unsubscribeCodes = [3, 5, 10, 12, 13];
        let purchaseToken = data.subscriptionNotification.purchaseToken;
        let notificationType = data.subscriptionNotification.notificationType;
        let productId = data.subscriptionNotification.subscriptionId;

        // subscription check
        let androidInAppOptions = {
            email: androidInAppJsonCred.client_email,
            key: androidInAppJsonCred.private_key
        }
        let androidVerifier = new Verifier(androidInAppOptions);
        let androidReceipt = {
            packageName: "com.connaughttechnologies.lovedonce",
            productId: productId,
            purchaseToken: purchaseToken
        }
        androidVerifier.verifySub(androidReceipt)
        .then((response) => {    
            if(response.isSuccessful){
                let expiryMillis = response.payload.expiryTimeMillis;
                expiryMillis = moment(expiryMillis, "x").format("YYYY-MM-DD HH:mm:ss");
                let packageAmount = response.payload.priceAmountMicros/1000000;
                dbObj.selectRow("subscription_histories", "id, user_id", { purchase_token: purchaseToken }).then(async (data) => {
                    if (data.counts > 0) {
                        dbObj.update("subscription_histories", { "status": 1, "purchase_price": packageAmount, "purchase_expiry_date": expiryMillis }, { "id": data.records.id });
                        dbObj.update("users", { "subscription_status": 1, "subscription_package": productId }, { "id": data.records.user_id });
                        /*if(subscribeCodes.includes(notificationType)){      // subscribe event
                            
                        } else if(unsubscribeCodes.includes(notificationType)){     // unsubscribe event
                            console.log("UnSub");
                        }*/
                    }
                });
            }
        })
        .catch(function(error) {
            console.log(error);
        })
      }
    }
  
    return res.sendStatus(204);
}

exports.iosInAppPurchasePaymentValidate = (req, res) => {
    let reqData = req.body;
    let rules = {
        order_id: 'required',
        product_id: 'required',
        purchase_token: 'required',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        let userData = req.session.user;
        
    }
}