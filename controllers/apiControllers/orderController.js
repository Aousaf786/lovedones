const Validator = require('validatorjs');
const dbObj = require("../../includes/connection");
const moment = require("moment");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { returnApiJson, orderStatus, stripeErrorsHandling } = require('../../includes/functions');

exports.createStripePaymentIntent = (req, res) => {
    let reqData = req.body;
    let rules = {
        service_id: 'required',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        dbObj.selectRow("services", "name, price", { id: reqData.service_id, status: 1 }).then(async (data) => {
            if (data.counts > 0) {
                let paymentIntent = await stripe.paymentIntents.create({
                        amount: data.records.price * 100,
                        currency: "gbp",
                        payment_method_types: ['card'],
                        description: "Payment for "+data.records.name+"(Service)",
                });
                let retObj = {
                    "payment_id": paymentIntent.id,
                    "client_secret": paymentIntent.client_secret
                }
                returnApiJson(res, 1, "Success", retObj);
            } else {
                returnApiJson(res, 0, "Service not found");
            }
        });
    }
}

exports.stripeWebHook = (req, res) => {
    let reqData = req.body;
    let paymentStatus;

    let eventType = reqData.type;
    let paymentId = reqData.data.object.id;
    if (eventType === "payment_intent.succeeded") {     // payment successfully
        paymentStatus = "Success";
    } else if(eventType === "payment_intent.payment_failed") {
        paymentStatus = "Failed";
    }

    dbObj.insert("payment_webhook_statuses", {"payment_id": paymentId, "status": paymentStatus});
    
    returnApiJson(res, 1, "Success");
}

exports.createOrder = async (req, res) => {
    // date format validation
    Validator.register(
        'dateInvalid',
        (value, requirement, attribute) => {
            return moment(value, "YYYY-MM-DD", true).isValid();
        },
        'The :attribute is not valid or not in the format YYYY-MM-DD.'
    );

    // time format validation
    Validator.register(
        'timeInvalid',
        (value, requirement, attribute) => {
            return moment(value, "HH:mm:ss", true).isValid();
        },
        'The :attribute is not valid or not in the format HH:mm:ss.'
    );

    let reqData = req.body;
    let rules = {
        services: 'required|array',
        'services.*.service_id': 'required',
        'services.*.name': 'required',
        'services.*.price': 'required',
        'services.*.quantity': 'required',
        'services.*.payable_amount': 'required',
        total_payable_amount: 'required',
        immediate: 'required',
        ordered_date: 'required|dateInvalid',
        ordered_time: 'required|timeInvalid',
        address: 'required',
        lat: 'required',
        lng: 'required',
        card_number: 'required',
        card_exp_month: 'required',
        card_exp_year: 'required',
        card_cvc: 'required',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        let cardToken, charge;
        let userId = req.session.user.id;
        let userEmail = req.session.user.email;
        try {
            // stripe card info
            cardToken = await stripe.tokens.create({
                    card: {
                        number: reqData.card_number,
                        exp_month: reqData.card_exp_month,
                        exp_year: reqData.card_exp_year,
                        cvc: reqData.card_cvc,
                    },
            });
        } catch (err) {
            console.log(err);
            let errorMsg = stripeErrorsHandling(err);
            
            returnApiJson(res, 0, errorMsg);
            return;
        }

        try {
            charge = await stripe.charges.create({
                amount: reqData.total_payable_amount * 100,
                currency: "gbp",
                source: cardToken.id,
                description: "Payment For Services",
                receipt_email: userEmail,
            });
        } catch (err) {
            console.log(err);
            let errorMsg = stripeErrorsHandling(err);
            
            returnApiJson(res, 0, errorMsg);
            return;
        }

        if(charge.status == "succeeded"){
            let paymentId = charge.id;
            let orderTimestamp = reqData.ordered_date+" "+reqData.ordered_time;
            let dataObj = { "user_id": userId, "total_price": reqData.total_payable_amount, "immediate": reqData.immediate, "ordered_date": orderTimestamp, "address": reqData.address, "lat": reqData.lat, "lng": reqData.lng, "payment_id": paymentId }
            dbObj.insert("orders", dataObj).then((insertData) => {
                if (insertData.response) {
                    let orderID = insertData.lastInsertId;
                    reqData.services.forEach(row => {
                        dbObj.insert("order_services", {"order_id": orderID, "service_id": row.service_id, "name": row.name, "price": row.price, "quantity": row.quantity, "payable_amount": row.payable_amount});
                    })
                    returnApiJson(res, 1, "Order created successfully");
                } else {
                    returnApiJson(res, 0, "Something error");
                }
            });
        } else {
            console.log(charge);
            returnApiJson(res, 0, "Something error in payment processing");
        }
    }
}

orderObj = (data, servicesArr) => {
    data.services = [];
    if(servicesArr["index"+data.id] != undefined){
        data.services = servicesArr["index"+data.id];
    }
    let dbDateTime = data.ordered_date;
    data.ordered_date = moment(dbDateTime).format("LL");
    data.ordered_time = moment(dbDateTime).format("hh:mm a");
    let statusArr = orderStatus(data.status);
    data.status_string = statusArr.status;

    delete data.service_id;
    delete data.employee_id;
    delete data.payment_id;
    delete data.updated_at;
    return data;
}

exports.OrderListing = (req, res) => {
    let userId = req.session.user.id;
    dbObj.select("orders", columns="*", {"user_id": userId}, "id DESC").then(async(data) => {
        let returnData = await orderDataStructure(data);
        returnApiJson(res, 1, "Success", { "data": returnData });
    });
}

exports.getOrderDetail = (req, res) => {
    let reqData = req.body;
    let rules = {
        order_id: 'required',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        let userId = req.session.user.id;
        dbObj.select("orders", columns="*", {"id": reqData.order_id, "user_id": userId}, "id DESC LIMIT 1").then(async(data) => {
            if (data.counts > 0) {
                let returnData = await orderDataStructure(data);
                returnApiJson(res, 1, "Success", returnData[0]);
            } else {
                returnApiJson(res, 0, "Order not found");
            }
        });
    }
}

orderDataStructure = (data) => {
    return new Promise(resolve => {
        if(data.counts == 0){
            resolve([]);
        } else {
            let orderArr = "", orderServiceArr = {};
            for(var i=0; i < data.counts; i++) {
                orderArr += data.records[i].id+",";
            }
            orderArr = orderArr.slice(0, orderArr.length - 1); // remove last  letter => ","

            dbObj.select("order_services", columns="order_id, service_id, name, price, quantity, payable_amount", "order_id IN ("+orderArr+")").then((data2) => {
                data2.records.forEach((val2) => {
                    let uniqueId = val2.order_id;
                    if(orderServiceArr["index"+uniqueId] == undefined){
                        orderServiceArr["index"+uniqueId] = [];
                    }
                    delete val2.order_id;
                    orderServiceArr["index"+uniqueId].push(val2);
                });

                data.records.forEach((val) => {
                    val = orderObj(val, orderServiceArr);
                });
                resolve(data.records);
            });
        }
    });
}

exports.orderCancel = (req, res) => {
    let reqData = req.body;
    let rules = {
        order_id: 'required',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        let userId = req.session.user.id;
        dbObj.selectRow("orders", "*", { id: reqData.order_id, user_id: userId }).then((data) => {
            if (data.counts > 0) {
                if(data.records.status == 1){
                    dbObj.update("orders", { status: 4 }, { "id": data.records.id });
                    returnApiJson(res, 1, "Order cancelled successfully.");
                } else {
                    returnApiJson(res, 0, "Order cancellation time overed therefore order will not be cancelled or Order already cancelled.");
                }
            } else {
                returnApiJson(res, 0, "Order not found");
            }
        });
    }
}