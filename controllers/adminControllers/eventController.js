const Validator = require('validatorjs');
const dbObj = require("../../includes/connection");
const { returnJson, randomNumber } = require('../../includes/functions');


exports.createEvents = (req, res) => {
    const reqData = {...req.params, ...req.body, ...req.files};
    let rules = {
        name: 'required',
        image: 'required',
        start_date:"required|date",
        end_date:"required|date",
        created_by:"required"
    };
    let validation = new Validator(reqData, rules);
    if (validation.fails()) {
        returnJson(res, 2, "Validation errors", [], validation.errors.all(), 422);
    } else {
        let reqFile = req.files;
        let storagePath, imgExt, fileName = null;
        if (reqFile && Object.keys(reqFile).length > 0) {
            storagePath = storageBasePath + "/event/";
            imgExt = reqFile.image.name.split('.').pop().toLowerCase();
            fileName = "event-" + Date.now() + randomNumber(1, 100000) + "." + imgExt;
            // save image on server
            reqFile.image.mv(storagePath + '/' + fileName);
        }
        dbObj.insert("events", { "name": reqData.name, "description": reqData.description, "image": fileName, "start_date": reqData.start_date, "end_date":reqData.end_date,"created_by":reqData.created_by }).then((insertData) => {
            if (insertData.response) {
                let returnId = insertData.lastInsertId;
                returnJson(res, 1, "Event added successfully", { "returnId": returnId });
            } else {
                returnJson(res, 0, "Something error");
            }
        });
    }
}
