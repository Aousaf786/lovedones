const Validator = require('validatorjs');
const dbObj = require("../../includes/connection");
const { returnApiJson } = require('../../includes/functions');

const returnFields = "id, name, image, description, start_date, end_date";

exports.getAllEvents = (req, res) => {
    dbObj.select("events", returnFields).then((data) => {
        data.records.forEach(element => {
            if(element.image){
                element.image = process.env.APP_URL+"/storage/event/"+element.image;
            }
        });
        returnApiJson(res, 1, "Success", { "data": data.records });
    });
}

exports.getEventDetail = (req, res) => {
    let reqData = req.body;
    let rules = {
        event_id: 'required',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        dbObj.selectRow("events", returnFields, { id: reqData.service_id }).then((data) => {
            if (data.counts > 0) {
                if(data.records.image){
                    data.records.image = process.env.APP_URL+"/storage/event/"+data.records.image;
                }
                returnApiJson(res, 1, "Success", data.records);
            } else {
                returnApiJson(res, 0, "Service not found");
            }
        });
    }
}