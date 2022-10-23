const Validator = require('validatorjs');
const dbObj = require("../../includes/connection");
const { returnApiJson } = require('../../includes/functions');

diaryData = (data) => {
    data.critical_tasks = JSON.parse(data.critical_tasks);
    return data;
}

exports.getAllDiaryData = (req, res) => {
    let userData = req.session.user;
    dbObj.select("diaries", "*", {"user_id": userData.id}, "id DESC").then((data) => {
        data.records.forEach((element) => {
            element = diaryData(element);
        });
        returnApiJson(res, 1, "Success", { "data": data.records });
    });
}

exports.addDiaryData = (req, res) => {
    let reqData = req.body;
    let userData = req.session.user;
    let criticalTasks = JSON.stringify(reqData.critical_tasks);
    let dataObj = { "user_id": userData.id, "daily_affirmation": reqData.daily_affirmation, "notes": reqData.notes, "today_wins": reqData.today_wins, "to_improve": reqData.to_improve, "critical_tasks": criticalTasks }
    dbObj.insert("diaries", dataObj).then((insertData) => {
        if (insertData.response) {
            returnApiJson(res, 1, "Diary added successfully");
        } else {
            returnApiJson(res, 0, "Something error");
        }
    });
}

exports.getDiaryData = (req, res) => {
    let reqData = req.body;
    let rules = {
        id: 'required',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        let userData = req.session.user;
        dbObj.selectRow("diaries", "*", {"id": reqData.id, "user_id": userData.id}).then((data) => {
            if (data.counts > 0) {
                returnApiJson(res, 1, "Success", diaryData(data.records));
            } else {
                returnApiJson(res, 0, "No diary found");
            }
        });
    }
}

exports.updateDiaryData = (req, res) => {
    let reqData = req.body;
    let rules = {
        id: 'required',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        let userData = req.session.user;
        let criticalTasks = JSON.stringify(reqData.critical_tasks);
        let dataObj = { "daily_affirmation": reqData.daily_affirmation, "notes": reqData.notes, "today_wins": reqData.today_wins, "to_improve": reqData.to_improve, "critical_tasks": criticalTasks }
        dbObj.selectRow("diaries", "id", {"id": reqData.id, "user_id": userData.id}).then((data) => {
            if (data.counts > 0) {
                dbObj.update("diaries", dataObj, {"id": reqData.id});
                returnApiJson(res, 1, "Diary updated successfully");
            } else {
                returnApiJson(res, 0, "No diary found");
            }
        });
    }
}

