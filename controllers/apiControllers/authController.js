const bcrypt = require('bcrypt');
const Validator = require('validatorjs');
const dbObj = require("../../includes/connection");
const ejs = require('ejs');
const { returnApiJson, randomStringGen, randomNumber, sendEmailSendGrid } = require('../../includes/functions');

exports.signupRequest = (req, res) => {
    let reqData = req.body;
    let rules = {
        name: 'required',
        email: 'required|email',
        password: 'required|confirmed',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        dbObj.selectRow("users", columns = "id", where = "email = '" + reqData.email + "'").then((data) => {
            if (data.counts > 0) {
                returnApiJson(res, 0, "Email already exist");
            } else {
                let tokenGen = randomStringGen(reqData.email);
                bcrypt.hash(reqData.password, 12).then((hashPass) => {
                    let dataObj = { "name": reqData.name, "email": reqData.email, "role": "User", "password": hashPass, "phone_number": reqData.phone_number, "address": reqData.address, "fcm_token": reqData.fcm_token, "api_token": tokenGen, "timezone": reqData.timezone }
                    dbObj.insert("users", dataObj).then((insertData) => {
                        if (insertData.response) {
                            let userId = insertData.lastInsertId;
                            // remove fcm token if any user have same token
                            dbObj.update("users", { "fcm_token": null }, "id != "+userId+" AND fcm_token = '"+reqData.fcm_token+"'");
                            // remove extra object keys
                            delete dataObj.password;
                            delete dataObj.role;
                            delete dataObj.fcm_token;
                            delete dataObj.timezone;
                            returnApiJson(res, 1, "Signup successfully", { "user": dataObj });
                        } else {
                            returnApiJson(res, 0, "Something error");
                        }
                    });
                });
            }
        });
    }
}


exports.loginRequest = (req, res) => {
    let reqData = req.body;
    let rules = {
        email: 'required|email',
        password: 'required',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        let tokenGen = randomStringGen(reqData.email);
        dbObj.selectRow("users", "id, name, email, phone_number, address, password", {"email": reqData.email, "role": "User", "status": 1}).then((data) => {
            if(data.counts > 0){
                bcrypt.compare(reqData.password, data.records.password).then((pasResult) => {
                    if(pasResult){
                        let dataObj = data.records;

                        // remove fcm token if any user have same token
                        dbObj.update("users", { "fcm_token": null }, "id != "+dataObj.id+" AND fcm_token = '"+reqData.fcm_token+"'");
                        // update fcm token & api token
                        dbObj.update("users", { "fcm_token": reqData.fcm_token, "api_token": tokenGen, "timezone": reqData.timezone }, {"id": dataObj.id});

                        dataObj.api_token = tokenGen;
                        // remove extra object keys
                        delete dataObj.id;
                        delete dataObj.password;
                        returnApiJson(res, 1, "Login successfully", { "user": dataObj });
                    } else {
                        returnApiJson(res, 0, "Invalid email or password");
                    }
                });
            } else {
                returnApiJson(res, 0, "Invalid email or password");
            }
        });
    }
}

exports.forgotPassRequest = (req, res) => {
    let reqData = req.body;
    let rules = {
        email: 'required|email',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        let returnTxt = "We've emailed you instructions for setting your password, if an account exist with this email, you should recieve them shortly.";
        dbObj.selectRow("users", columns="id, name", {"email": reqData.email}).then((data) => {
            if(data.counts > 0){
                let tokenGen = randomNumber(100000, 999999);
                let insertData = {
                        user_id: data.records.id,
                        string: tokenGen
                    }
                dbObj.insert("verified_process", insertData).then((data2) => {

                    // delete token if exist
                    dbObj.delete("verified_process", "id != "+data2.lastInsertId+" AND string = '"+tokenGen+"'");

                    // email base path is global variable
                    ejs.renderFile(emailBasePath + '/forgotPassMailForMob.ejs', { userName: data.records.name, token: tokenGen}, {}, (err, str) => {
                        if (err) {
                            returnApiJson(res, 0, "Something error");
                        } else {
                            sendEmailSendGrid(reqData.email, "Forgot password email", str);
                            returnApiJson(res, 1, returnTxt);
                        }
                    });
                });
            } else {
                returnApiJson(res, 0, "Account not found related to this email address or account was blocked by admin.");
            }
        });
    }
}

exports.resetPassOtpVerified = (req, res) => {
    let reqData = req.body;
    let rules = {
        otp_code: 'required',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        dbObj.selectRow("verified_process", columns="user_id", {"string": reqData.otp_code}).then((data) => {
            if(data.counts > 0){
                let encodeId = Buffer.from(data.records.user_id.toString()).toString('base64');
                dbObj.delete("verified_process", {"user_id": data.records.user_id});
                returnApiJson(res, 1, "Otp verified.", {"token": encodeId});
            } else {
                returnApiJson(res, 0, "Reset password otp code was expired or not existed.");
            }
        });
    }
}

exports.resetPassRequest = (req, res) => {
    let reqData = req.body;
    let rules = {
        token: 'required',
        password: 'required|confirmed',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        let userId = Buffer.from(reqData.token, 'base64').toString('ascii');
        console.log(userId);
        dbObj.selectRow("users", columns="id", {"id": userId}).then((data) => {
            if(data.counts > 0){
                bcrypt.hash(reqData.password, 12).then((hash) => {
                    dbObj.update("users", {"password": hash}, {"id": userId});
                    returnApiJson(res, 1, "Password update successfully");
                });
            } else {
                returnApiJson(res, 0, "User not found or token is incorrect.");
            }
        });
    }
}