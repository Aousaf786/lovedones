const Validator = require('validatorjs');
const dbObj = require("../../includes/connection");
const { returnApiJson } = require('../../includes/functions');

const returnFields = "id, name, price, description, cover_img";

exports.getAllServices = (req, res) => {
    dbObj.select("services", returnFields, {"status": 1}, "id DESC").then((data) => {
        data.records.forEach(element => {
            if(element.cover_img){
                element.cover_img = process.env.APP_URL+"/storage/services/"+element.cover_img;
            }
        });
        returnApiJson(res, 1, "Success", { "data": data.records });
    });
}

exports.getServiceDetail = (req, res) => {
    let reqData = req.body;
    let rules = {
        service_id: 'required',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        dbObj.selectRow("services", returnFields, { id: reqData.service_id, status: 1 }).then((data) => {
            if (data.counts > 0) {
                if(data.records.cover_img){
                    data.records.cover_img = process.env.APP_URL+"/storage/services/"+data.records.cover_img;
                }
                returnApiJson(res, 1, "Success", data.records);
            } else {
                returnApiJson(res, 0, "Service not found");
            }
        });
    }
}