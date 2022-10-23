const Validator = require('validatorjs');
const dbObj = require("../../includes/connection");
const moment = require("moment-timezone");
const { returnApiJson } = require('../../includes/functions');

exports.setReminder = (req, res) => {
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

    // timezone validation
    Validator.register(
        'timezoneInvalid',
        (value, requirement, attribute) => {
            return moment.tz.zone(value) != null;
        },
        'The :attribute is not valid timezone.'
    );

    let reqData = req.body;
    let rules = {
        schedule_date: 'required|dateInvalid',
        schedule_time: 'required|timeInvalid',
        title: 'required',
        timezone: 'required|timezoneInvalid',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        let userId = req.session.user.id;
        let scheduleTimestamp = reqData.schedule_date+" "+reqData.schedule_time;
        scheduleTimestamp = moment.tz(scheduleTimestamp, reqData.timezone).utc().format("YYYY-MM-DD HH:mm:ss");  // convert user timezone to utc
        let dataObj = { "user_id": userId, "title": reqData.title, "schedule_date": scheduleTimestamp }
        dbObj.insert("reminders", dataObj).then((insertData) => {
            if (insertData.response) {
                returnApiJson(res, 1, "Reminder set successfully");
            } else {
                returnApiJson(res, 0, "Something error");
            }
        });
    }
}