const e = require("express");
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const axios = require('axios').default;

exports.returnJson = (res, code, message, data = [], error = [], statusCode = 200) => {
    res.status(statusCode).json({
        code : code,
        message: message,
        data : data,
        errors : error,
    });
}

exports.returnApiJson = (res, code, message, data = null, error = null, statusCode = 200) => {
    res.status(statusCode).json({
        code : code,
        message: message,
        data : data,
        errors : error,
    });
}

exports.checkAdminSession = (req) => {
    return new Promise(resolve => {
        if(req.session.admin){
            resolve(true);
        } else {
            resolve(false);
        }
        return;
    });
}

exports.randomStringGen = (unique) => {
    let bufferVal = Buffer.from("'"+unique+"'");
    return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)+bufferVal.toString("base64");
}

exports.randomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min) + min);
}

exports.sendEmail = (emailTo, emailSubj, emailTxt) => {
    var transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD
        }
    });

    var mailOptions = {
        from: process.env.MAIL_FROM_ADDRESS,
        to: emailTo,
        subject: emailSubj,
        html: emailTxt
    };

    return new Promise(resolve => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

exports.sendEmailSendGrid = (emailTo, emailSubj, emailTxt) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
        to: emailTo, // Change to your recipient
        from: process.env.MAIL_FROM_ADDRESS, // Change to your verified sender
        subject: emailSubj,
        html: emailTxt,
      }
    return new Promise(resolve => {
        sgMail.send(msg).then(() => {
            console.log('Email sent');
            resolve(true);
        }).catch((error) => {
            console.error(error);
            resolve(false);
        });
    });
}

exports.capitalizeWord = (text) => {
    return text.replace(/(^\w|\s\w)(\S*)/g, (_,m1,m2) => m1.toUpperCase()+m2.toLowerCase());
}

exports.currencyFormat = (digit) => {
    digit = (digit == null)? 0: digit;
    digit = parseInt(digit);
	if (digit >= 1000000000) {
        return (digit/ 1000000000).toFixed(1) + 'G';
    }
    if (digit >= 1000000) {
        return (digit/ 1000000).toFixed(1) + 'M';
    }
    if (digit >= 1000) {
        return (digit/ 1000).toFixed(1) + 'K';
    }
    return digit;
}

exports.numberFormat = (num) => {
    return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

exports.findReplaceStr = (string, find, replace) => {
    return string.split(find).join(replace);
}

exports.orderStatus = (id) => {
    let statusArr= [];
    switch(id){
        case 1:
            statusArr.status = "Pending";
            statusArr.cssClass = "warning";
            break;
        case 2:
            statusArr.status = "Completed";
            statusArr.cssClass = "success";
            break;
        case 3:
            statusArr.status = "Assigned";
            statusArr.cssClass = "primary";
            break;
        case 4:
            statusArr.status = "Cancelled";
            statusArr.cssClass = "danger";
            break;
    }
    return statusArr;
}

exports.retOrderStatusId = (string) => {
    let statusArr= [];
    switch(string){
        case "pending":
            statusArr.status = 1;
            statusArr.cssClass = "warning";
            break;
        case "completed":
            statusArr.status = 2;
            statusArr.cssClass = "success";
            break;
        case "assigned":
            statusArr.status = 3;
            statusArr.cssClass = "primary";
            break;
        case "cancelled":
            statusArr.status = 4;
            statusArr.cssClass = "danger";
            break;
    }
    return statusArr;
}

exports.stripeErrorsHandling = (err) => {
    let errorMsg;
    switch (err.type) {
        case 'StripeCardError':
            // A declined card error
            errorMsg = err.message; // => e.g. "Your card's expiration year is invalid."
            break;
        case 'StripeRateLimitError':
            // Too many requests made to the API too quickly
            errorMsg = err.message;
            break;
        case 'StripeInvalidRequestError':
            // Invalid parameters were supplied to Stripe's API
            errorMsg = err.message;
            break;
        case 'StripeAPIError':
            // An error occurred internally with Stripe's API
            errorMsg = err.message;
            break;
        case 'StripeConnectionError':
            // Some kind of error occurred during the HTTPS communication
            errorMsg = err.message;
            break;
        case 'StripeAuthenticationError':
            // You probably used an incorrect API key
            errorMsg = err.message;
            break;
        default:
            // Handle any other types of unexpected errors
            errorMsg = err.message;
            break;
    }
    return errorMsg;
}

exports.getMonthsBwDates = (startDate, endDate) => {        // moment.js date object
    var timeValues = [];
    while (endDate > startDate || startDate.format('M') === endDate.format('M')) {
        timeValues.push(startDate.format('MM YYYY'));
        startDate.add(1, 'month');
    }
    return timeValues;
}

exports.pushNotiPayload = (title, message, image = "", sound = "default", data = []) => {
    let dataBody = {
        "title" : title,
        "message" : message,
        "image" : image,
        "data" : data
    }

    let dataNoti = {
        "title" : title,
        "body" : message,
        "sound": sound,
        "image" : image,
        "data" : data
    }
    return {
        "dataBody": dataBody,
        "dataNoti": dataNoti
    }
}

exports.sendPushNoti = (fcmTokens, dataBody, dataNoti) => {
    // Send the HTTP request to the firebase
    axios({
        method: 'post',
        url: "https://fcm.googleapis.com/fcm/send",
        headers: { 'Authorization': 'key='+process.env.FIREBASE_SERVER_KEY, 'Content-Type': 'application/json' },
        data: {
            "registration_ids" :  fcmTokens,
            "priority" : "high",
            "content_available" : true,
            "mutable_content" : true,
            "notification" : dataNoti,
            "data" : dataBody
        },
    }).then(function (response) {
        //console.log(response);
        if(response.data.success > 0){
            return true;
        } else {
            return false;
        }
    })
    .catch(function (error) {
        console.log(error.message);
        return false;
    });

}