const Validator = require('validatorjs');
const dbObj = require("../../includes/connection");
const { returnApiJson } = require('../../includes/functions');

const returnFields = "id, email";

exports.getAllFamilyEmails = (req, res) => {
    let userData = req.session.user;
    dbObj.select("families", returnFields, {"user_id": userData.id}).then((data) => {
        returnApiJson(res, 1, "Success", { "data": data.records });
    });
}

exports.updateFamilyEmails = (req, res) => {
    let reqData = req.body;
    let rules = {
        emails: 'required|array',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        let userData = req.session.user;
        dbObj.delete("families", {"user_id": userData.id}).then((data) => {
            reqData.emails.forEach(element => {
                dbObj.insert("families", { "email": element, "user_id": userData.id }).then((insertData) => {
                    if (insertData.response) {
                        dbObj.update("users", {"family_subscription_status": 1}, {"email": element});
                    }
                });
            });
            returnApiJson(res, 1, "Family email updated successfully.");
        });
    }
}