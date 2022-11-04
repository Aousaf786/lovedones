const bcrypt = require('bcrypt');
const Validator = require('validatorjs');
const dbObj = require("../../includes/connection");
const { returnApiJson } = require('../../includes/functions');

userObj = (user) => {
    // remove extra data
    delete user.id;
    delete user.password;
    delete user.fcm_token;
    delete user.role;
    delete user.status;
    delete user.profile_img;
    delete user.created_at;
    delete user.updated_at;
    return user;
}

exports.getProfileDetail = (req, res) => {
    let user = req.session.user;
    let userData = userObj(user);
    returnApiJson(res, 1, "Success", { "user": userData });
}

exports.updateProfile = (req, res) => {
    let reqData = req.body;
    let rules = {
        name: 'required',
        phone_number: 'required',
        address: 'required',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        let sessionData = req.session.user;
        let userId = sessionData.id;
        // user data updated in db & update user session as well
        dbObj.update("users", { "name": reqData.name, "phone_number": reqData.phone_number, "address": reqData.address }, { "id": userId });
        sessionData.name = reqData.name;
        sessionData.phone_number = reqData.phone_number;
        sessionData.address = reqData.address;

        // password update
        if (reqData.password != "" && reqData.password != null) {
            bcrypt.hash(reqData.password, 12).then((hash) => {
                dbObj.update("users", { "password": hash }, { "id": userId });
            });
        }

        let user = userObj(sessionData);

        returnApiJson(res, 1, "Profile updated successfully", {"user": user});
    }
}

exports.updateAdditionalInfo = (req, res) => {
    let reqData = req.body;
    let rules = {
        additional_info: 'required',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        let sessionData = req.session.user;
        let userId = sessionData.id;
        // user data updated in db & update user session as well
        dbObj.update("users", { "additional_info": reqData.additional_info }, { "id": userId });
        sessionData.additional_info = reqData.additional_info;

        let user = userObj(sessionData);

        returnApiJson(res, 1, "Additional information updated successfully", {"user": user});
    }
}