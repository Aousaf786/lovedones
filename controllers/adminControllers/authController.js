const bcrypt = require('bcrypt');
const Validator = require('validatorjs');
const dbObj = require("../../includes/connection");
const { returnJson } = require('../../includes/functions');

exports.loginPage = async (req, res) => {
    var passDataToView = {
        page_title: "Admin Login Page",
    };
    res.render("admin/auth/login", passDataToView);
}

exports.loginRequest = (req, res) => {
    let reqData = req.body;
    let rules = {
        email: 'required|email',
        password: 'required',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnJson(res, 2, "Validation errors", [], validation.errors.all(), 422);
    } else {
        dbObj.selectRow("users", columns="*", {"email": reqData.email, "role": "Admin", "status": 1}).then((data) => {
            if(data.counts > 0){
                // bcrypt.compare(reqData.password, data.records.password).then((pasResult) => {
                    if(true){
                        req.session.admin = data.records;
                        returnJson(res, 1, "Login successfully");
                    } else {
                        returnJson(res, 0, "Invalid email or password", [], [], 401);
                    }
                // });
            } else {
                returnJson(res, 0, "Invalid email or password", [], [], 401);
            }
        });
    }
}

exports.logoutRequest = (req, res) => {
    req.session.admin = null;
    return res.redirect('/admin/login');
}