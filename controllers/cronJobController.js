const dbObj = require("../includes/connection");
const moment = require("moment-timezone");
const { pushNotiPayload, sendPushNoti } = require('../includes/functions');

exports.sendReminderThroughPushNoti = () => {
    let currentTime = moment().utc().format("YYYY-MM-DD HH:mm");        // current time in UTC
    dbObj.getRecords("SELECT reminders.*, users.fcm_token FROM reminders JOIN users ON reminders.user_id = users.id WHERE reminders.status = '1' AND schedule_date <= '"+currentTime+":59'").then((data) => {
        let i;
        for(i=0 ; i < data.records.length; i++){
            let currentRec = data.records[i];
            let notiPayload = pushNotiPayload("Reminder", currentRec.title);
            let userArr = [currentRec.fcm_token];
            sendPushNoti(userArr, notiPayload.dataBody, notiPayload.dataNoti);
            dbObj.update("reminders", { "status": 0 }, {"id": currentRec.id});
        }
    });
}

exports.userSubscriptionCheck = () => {
    let currentTime = moment().utc().format("YYYY-MM-DD HH:mm");        // current time in UTC
    dbObj.getRecords("SELECT subscription_histories.*, users.subscription_status FROM subscription_histories JOIN users ON subscription_histories.user_id = users.id WHERE subscription_histories.status = '1' AND purchase_expiry_date <= '"+currentTime+":59'").then((data) => {
        let i;
        for(i=0 ; i < data.records.length; i++){
            let currentRec = data.records[i];
            dbObj.update("subscription_histories", { "status": 0 }, { "id": currentRec.id });
            dbObj.update("users", { "subscription_status": 0 }, { "id": currentRec.user_id });
        }
    });
}