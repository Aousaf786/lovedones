const bcrypt = require('bcrypt');
const Validator = require('validatorjs');
const moment = require("moment");
const fs = require('fs-extra');
const dbObj = require("../../includes/connection");
const { returnJson, capitalizeWord } = require('../../includes/functions');

exports.listingPage = (req, res) => {
    var passDataToView = {
        page_title: "All User Listing",
        adminSession: req.session.admin,
        sidebarActive: "Users",
        childSidebarActive: "All-Users",
        breadCrumb: ["Home", "Users"],
        sectionTitle: "All Users",
        datatableUrl: "/admin/users/all-users-datatable",
    };
    res.render("admin/users/listing", passDataToView);
}

exports.allUsersDatatable = (req, res) => {
    let reqBody = req.body;
    dbObj.datatableRecords(reqBody, "users").then((data) => {
        data.data.forEach((val) => {
            val = userDtReturnResp(val, req);
        });
        res.json(data);
    });
}

// datatable custom return response
userDtReturnResp = (val, req) => {
    val.created_at = moment(val.created_at).format(process.env.DATE_FORMAT);
    let editUrl = "/admin/users/edit-user/" + val.id;
    if (req.session.admin.id == val.id) {
        editUrl = "/admin/my-profile";
    }
    val.action = `<a href="` + editUrl + `" class="btn btn-primary btn-sm">Edit</a> `;
    /*if (req.session.admin.id != val.id) {
        val.action += `<a href="/admin/users/delete-user/` + val.id + `" class="deletedBtn btn btn-danger btn-sm">Delete</a>`;
    }*/
    return val;
}

exports.addUserPage = (req, res) => {
    let userType = "User";
    if(req.query.type == "employee" ){
        userType = "Employee";
    }
    var passDataToView = {
        page_title: "Add "+userType,
        adminSession: req.session.admin,
        sidebarActive: "Users",
        childSidebarActive: "",
        breadCrumb: ["Home", "Users", "Add "+userType],
        userType: userType,
    };
    res.render("admin/users/add", passDataToView);
}

exports.addUserRequest = (req, res) => {
    let reqData = req.body;
    let rules = {
        name: 'required',
        email: 'required|email',
        password: 'required',
        role: 'required|in:Admin,User,Employee',
    };
    let validation = new Validator(reqData, rules);
    if (validation.fails()) {
        returnJson(res, 2, "Validation errors", [], validation.errors.all(), 422);
    } else {
        dbObj.selectRow("users", columns = "id", where = "email = '" + reqData.email + "'").then((data) => {
            if (data.counts > 0) {
                returnJson(res, 0, "Email already exist");
            } else {
                bcrypt.hash(reqData.password, 12).then((hashPass) => {
                    dbObj.insert("users", { "name": reqData.name, "email": reqData.email, "role": reqData.role, "password": hashPass, "phone_number": reqData.phone_number, "address": reqData.address, }).then((insertData) => {
                        if (insertData.response) {
                            let userId = insertData.lastInsertId;

                            returnJson(res, 1, "User added successfully", { "returnId": userId });
                        } else {
                            returnJson(res, 0, "Something error");
                        }
                    });
                });
            }
        });
    }
}

exports.editUserPage = (req, res) => {
    var passDataToView = {
        page_title: "Edit User",
        adminSession: req.session.admin,
        sidebarActive: "Users",
        childSidebarActive: "",
        breadCrumb: ["Home", "Users", "Edit User"],
    };
    dbObj.selectRow("users", columns = "*", { id: req.params.id }).then((data) => {
        if (data.counts > 0) {
            passDataToView.userDetail = data.records;
            res.render("admin/users/edit", passDataToView);
        } else {
            res.status(404).render('errors/404');
        }
    });
}

exports.updateUserRequest = (req, res) => {
    let reqData = req.body;
    let rules = {
        user_id: 'required',
        name: 'required',
        email: 'required|email',
    };
    let validation = new Validator(reqData, rules);
    if (validation.fails()) {
        returnJson(res, 2, "Validation errors", [], validation.errors.all(), 422);
    } else {
        let userId = reqData.user_id;
        dbObj.selectRow("users", columns = "*", where = "email = '" + reqData.email + "' AND id != " + userId).then((data) => {
            if (data.counts > 0) {
                returnJson(res, 0, "Email already exist");
            } else {
                dbObj.update("users", { "name": reqData.name, "email": reqData.email, "status": reqData.status, "phone_number": reqData.phone_number, "address": reqData.address, "additional_info": reqData.additional_info }, { "id": userId });

                let adminSession = req.session.admin;
                if(adminSession.id == userId){
                    // update admin session
                    adminSession.name = reqData.name;
                    adminSession.email = reqData.email;
                    adminSession.status = reqData.status;
                    adminSession.phone_number = reqData.phone_number;
                    adminSession.address = reqData.address;
                }

                // password update
                if (reqData.password != "" && reqData.password != null) {
                    bcrypt.hash(reqData.password, 12).then((hash) => {
                        dbObj.update("users", { "password": hash }, { "id": userId });
                    });
                }

                returnJson(res, 1, "User updated successfully");
            }
        });
    }
}

exports.deleteUserRequest = (req, res) => {
    let userId = req.params.id;
    if (userId == req.session.admin.id) {
        returnJson(res, 0, "User can't be deleted.");
    }
    dbObj.delete("users", { id: userId });
    //dbObj.delete("ringtones_wallpapers", { user_id: userId });
    // remove directory with files
    let storagePath = storageBasePath + "/users/" + userId;
    fs.remove(storagePath, (err) => {
        if (err) {
            console.log(err);
        }
    });
    returnJson(res, 1, "User deleted successfully");
}

exports.listingAccordingFilterPage = (req, res) => {
    let filter = req.params.filter;
    if (filter != "admin" && filter != "user" && filter != "employee") {
        res.status(404).render('errors/404');
    } else {
        let filterTxt = capitalizeWord(filter);
        var passDataToView = {
            page_title: filterTxt + " Listing",
            adminSession: req.session.admin,
            sidebarActive: "Users",
            childSidebarActive: filterTxt,
            breadCrumb: ["Home", "Users", filterTxt + "s"],
            sectionTitle: filterTxt + "s",
            datatableUrl: "/admin/users/datatable-filter/" + filter,
        };

        res.render("admin/users/listing", passDataToView);
    }
}

exports.listingAccordingFilterDatatable = (req, res) => {
    let reqBody = req.body;
    let filter = req.params.filter;
    dbObj.datatableRecords(reqBody, "users", "role= '" + capitalizeWord(filter) + "'").then((data) => {
        data.data.forEach((val) => {
            val = userDtReturnResp(val, req);
        });
        res.json(data);
    });
}