const { checkAdminSession, returnApiJson } = require('./functions');
const dbObj = require("./connection");
const Validator = require('validatorjs');

exports.checkAdminSession = async (req, res, next) => {
    let checkSession = await checkAdminSession(req);
    if(!checkSession){
        return res.redirect('/admin/login');
    }
    next();
}

exports.redirectAdminSessionExist = async (req, res, next) => {
    let checkSession = await checkAdminSession(req);
    if(checkSession){
        return res.redirect('/admin/dashboard');
    }
    next();
}

exports.checkApiSession = async (req, res, next) => {
    let reqData = req.query;
    let rules = {
        api_token: 'required',
    };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 3, "Unauthorized access, Please contact to administrator");
    } else {
        dbObj.selectRow("users", columns = "*", {"api_token": reqData.api_token, "role": "User", "status": 1}).then((data) => {
            if(data.counts > 0){
                req.session.user = data.records;
                next();
            } else {
                returnApiJson(res, 3, "Unauthorized access, Please contact to administrator");
            }
        });
    }
}

exports.checkSubscriptionStatus = async (req, res, next) => {
    let sessionUser = req.session.user;
    if(sessionUser.subscription_status == 1 || sessionUser.family_subscription_status == 1){
        next();
    } else {
        returnApiJson(res, 4, "Subscription required, You are accessing the premium feature of the app");
    }
}