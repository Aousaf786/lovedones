const Validator = require('validatorjs');
const moment = require("moment");
const fs = require('fs-extra');
const dbObj = require("../../includes/connection");
const { returnJson, randomNumber } = require('../../includes/functions');

exports.listingPage = (req, res) => {
    var passDataToView = {
        page_title: "All Services Listing",
        adminSession: req.session.admin,
        sidebarActive: "Services",
        childSidebarActive: "",
        breadCrumb: ["Home", "Services"],
        sectionTitle: "All Services",
    };
    dbObj.select("services", "*", "", "id DESC").then((data) => {
        passDataToView.records = data.records;
        passDataToView.moment = moment;
        passDataToView.DATE_FORMAT = process.env.DATE_FORMAT;
        res.render("admin/services/listing", passDataToView);
    });
}

exports.addServicePage = (req, res) => {
    var passDataToView = {
        page_title: "Add Service",
        adminSession: req.session.admin,
        sidebarActive: "Services",
        childSidebarActive: "",
        breadCrumb: ["Home", "Services", "Add Service"],
    };
    res.render("admin/services/add", passDataToView);
}

exports.addServiceRequest = (req, res) => {
    let reqData = req.body;
    let rules = {
        name: 'required',
        price: 'required',
    };
    let validation = new Validator(reqData, rules);
    if (validation.fails()) {
        returnJson(res, 2, "Validation errors", [], validation.errors.all(), 422);
    } else {
        let reqFile = req.files;
        let storagePath, imgExt, fileName = null;
        if (reqFile && Object.keys(reqFile).length > 0) {
            storagePath = storageBasePath + "/services/";
            imgExt = reqFile.cover_img.name.split('.').pop().toLowerCase();
            fileName = "service-" + Date.now() + randomNumber(1, 100000) + "." + imgExt;
            // save image on server
            reqFile.cover_img.mv(storagePath + '/' + fileName);
        }
        dbObj.insert("services", { "name": reqData.name, "description": reqData.description, "price": reqData.price, "cover_img": fileName }).then((insertData) => {
            if (insertData.response) {
                let returnId = insertData.lastInsertId;
                returnJson(res, 1, "Service added successfully", { "returnId": returnId });
            } else {
                returnJson(res, 0, "Something error");
            }
        });
    }
}

exports.editServicePage = (req, res) => {
    var passDataToView = {
        page_title: "Edit Service",
        adminSession: req.session.admin,
        sidebarActive: "Services",
        childSidebarActive: "",
        breadCrumb: ["Home", "Services", "Edit Service"],
    };
    dbObj.selectRow("services", columns = "*", { id: req.params.id }).then((data) => {
        if (data.counts > 0) {
            passDataToView.record = data.records;
            res.render("admin/services/edit", passDataToView);
        } else {
            res.status(404).render('errors/404');
        }
    });
}

exports.updateServiceRequest = (req, res) => {
    let reqData = req.body;
    let rules = {
        service_id: 'required',
        name: 'required',
        price: 'required',
    };
    let validation = new Validator(reqData, rules);
    if (validation.fails()) {
        returnJson(res, 2, "Validation errors", [], validation.errors.all(), 422);
    } else {
        let recordId = reqData.service_id;
        dbObj.selectRow("services", columns = "*", { id: recordId }).then((data) => {
            if (data.counts > 0) {
                let record = data.records;

                let reqFile = req.files;
                let storagePath, imgExt, fileName = record.cover_img;
                if (reqFile && Object.keys(reqFile).length > 0) {
                    storagePath = storageBasePath + "/services/";
                    imgExt = reqFile.cover_img.name.split('.').pop().toLowerCase();
                    fileName = "service-" + Date.now() + randomNumber(1, 100000) + "." + imgExt;
                    // save image on server
                    reqFile.cover_img.mv(storagePath + '/' + fileName);

                    // delete old file
                    if(record.cover_img){
                        fs.unlink(storagePath + '/' + record.cover_img, (err) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                }

                dbObj.update("services", { "name": reqData.name, "status": reqData.status, "description": reqData.description, "price": reqData.price, "cover_img": fileName }, { "id": recordId });

                returnJson(res, 1, "Service updated successfully");
            } else {
                returnJson(res, 0, "Service not found.");
            }
        });
    }
}

exports.deleteServiceRequest = (req, res) => {
    let recordId = req.params.id;
    dbObj.selectRow("services", columns = "*", { id: recordId }).then((data) => {
        if (data.counts > 0) {
            let record = data.records;

            // delete old file
            if(record.cover_img){
                let storagePath = storageBasePath + "/services/";
                fs.unlink(storagePath + '/' + record.cover_img, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            }

            dbObj.delete("services", { id: recordId });
            returnJson(res, 1, "Service deleted successfully");
        } else {
            returnJson(res, 0, "Service not found.");
        }
    });
}