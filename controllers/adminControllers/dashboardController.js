const dbObj = require("../../includes/connection");
const { currencyFormat } = require('../../includes/functions');

exports.dashboardPage = (req, res) => {
    var passDataToView = {
        page_title: "Dashboard",
        adminSession: req.session.admin,
        sidebarActive: "Dashboard",
        breadCrumb: ["Home", "Dashboard"],
    };
    passDataToView.totalAdmins = 0;
    passDataToView.totalUsers = 0;
    passDataToView.totalEmployees = 0;
    passDataToView.pendingOrders = 0;
    passDataToView.successOrders = 0;
    passDataToView.assignOrders = 0;
    passDataToView.cancelOrders = 0;
    dbObj.getRecords("SELECT role, count(id) AS count FROM users GROUP BY role").then((data) => {      // user records
        let userData = data.records;
        for(var i=0; i < userData.length; i++) {
            if(userData[i].role == "Admin"){
                passDataToView.totalAdmins = userData[i].count;
            } else if(userData[i].role == "User"){
                passDataToView.totalUsers = userData[i].count;
            } else {
                passDataToView.totalEmployees = userData[i].count;
            }
        }
        dbObj.getRecords("SELECT status, count(id) AS count FROM orders GROUP BY status").then((data2) => {  // order records
            let ordersData = data2.records;
            for(var i=0; i < ordersData.length; i++) {
                if(ordersData[i].status == 1){
                    passDataToView.pendingOrders = ordersData[i].count;
                } else if(ordersData[i].status == 2){
                    passDataToView.successOrders = ordersData[i].count;
                } else if(ordersData[i].status == 3){
                    passDataToView.assignOrders = ordersData[i].count;
                } else if(ordersData[i].status == 4){
                    passDataToView.cancelOrders = ordersData[i].count;
                }
            }
            dbObj.getRecords("SELECT DATE_FORMAT(ordered_date, '%b %Y') as monthYear, MONTH(ANY_VALUE(ordered_date)) as monthNumber, year(ANY_VALUE(ordered_date)) as yearNumber, SUM(IF(status = '2', total_price, 0)) as price, count(id) as orderCount FROM orders GROUP BY monthYear ORDER BY yearNumber DESC,monthNumber DESC").then((data3) => {  // orders report month wise
                passDataToView.monthWiseOrderReportData = data3.records;
                passDataToView.currencyFormat = currencyFormat;
                res.render("admin/dashboard/index", passDataToView);
            });
        }); 
    });
}

exports.editProfilePage = (req, res) => {
    var passDataToView = {
        page_title: "My Profile",
        adminSession: req.session.admin,
        sidebarActive: "Users",
        childSidebarActive: "",
        breadCrumb: ["Home", "Profile"],
    };
    passDataToView.userDetail = req.session.admin;
    res.render("admin/users/edit", passDataToView);
}