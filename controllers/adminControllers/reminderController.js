const moment = require("moment");
const dbObj = require("../../includes/connection");

exports.listingPage = (req, res) => {
    var passDataToView = {
        page_title: "All Reminder Listing",
        adminSession: req.session.admin,
        sidebarActive: "Reminders",
        childSidebarActive: "",
        breadCrumb: ["Home", "Reminders"],
        sectionTitle: "All Reminders",
        datatableUrl: "/admin/reminders/all-reminders-datatable",
    };
    res.render("admin/reminders/listing", passDataToView);
}

exports.allRemindersDatatable = (req, res) => {
    let reqBody = req.body;
    dbObj.datatableWithJoinRecords(reqBody, "reminders", "reminders.*, users.name as user_name", "JOIN users ON reminders.user_id=users.id").then((data) => {
        data.data.forEach((val) => {
            val = orderDtReturnResp(val, req);
        });
        res.json(data);
    });
}

// datatable custom return response
orderDtReturnResp = (val, req) => {
    let cssClass = "success";
    let status = "Completed";
    if(val.status == 1){
        cssClass = "warning";
        status = "Pending";
    }
    val.status = '<span class="badge light badge-'+cssClass+'">'+status+'</span>';
    val.schedule_date = moment(val.schedule_date).format(process.env.DATE_FORMAT);
    val.created_at = moment(val.created_at).format(process.env.DATE_FORMAT);
    return val;
}