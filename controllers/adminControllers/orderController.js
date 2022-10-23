const Validator = require('validatorjs');
const moment = require("moment");
const dbObj = require("../../includes/connection");
const { returnJson, orderStatus, capitalizeWord, retOrderStatusId } = require('../../includes/functions');

exports.listingPage = (req, res) => {
    var passDataToView = {
        page_title: "All Order Listing",
        adminSession: req.session.admin,
        sidebarActive: "Orders",
        childSidebarActive: "All-Orders",
        breadCrumb: ["Home", "Orders"],
        sectionTitle: "All Orders",
        datatableUrl: "/admin/orders/all-orders-datatable",
    };
    res.render("admin/orders/listing", passDataToView);
}

exports.allOrdersDatatable = (req, res) => {
    let reqBody = req.body;
    dbObj.datatableWithJoinRecords(reqBody, "orders", "orders.*, users.name as user_name", "JOIN users ON orders.user_id=users.id").then(async(data) => {
        let returnData = await orderDTDataStructure(data);
        res.json(returnData);
    });
}

orderDTDataStructure = (data) => {
    return new Promise(resolve => {
        if(data.data.length == 0){
            resolve(data);
        } else {
            let orderArr = "", orderServiceArr = {};
            for(var i=0; i < data.data.length; i++) {
                orderArr += data.data[i].id+",";
            }
            orderArr = orderArr.slice(0, orderArr.length - 1); // remove last  letter => ","
            dbObj.select("order_services", columns="order_id, service_id, name, price, quantity, payable_amount", "order_id IN ("+orderArr+")").then((data2) => {
                data2.records.forEach((val2) => {
                    let uniqueId = val2.order_id;
                    if(orderServiceArr["index"+uniqueId] == undefined){
                        orderServiceArr["index"+uniqueId] = {};
                        orderServiceArr["index"+uniqueId].listing = [];
                        orderServiceArr["index"+uniqueId].services_name = "";
                    }
                    orderServiceArr["index"+uniqueId].services_name += val2.name+", ";
                    delete val2.order_id;
                    orderServiceArr["index"+uniqueId].listing.push(val2);
                });

                data.data.forEach((row) => {
                    row = orderDTRetResp(row, orderServiceArr);
                });
                resolve(data);
            });
        }
    });
}

// datatable custom return response
orderDTRetResp = (val, servicesArr) => {
    val.services = [];
    val.services_name = "";
    if(servicesArr["index"+val.id] != undefined){
        val.services = servicesArr["index"+val.id].listing;
        let servicesName = servicesArr["index"+val.id].services_name;
        val.services_name = servicesName.slice(0, servicesName.length - 2);        // remove last 2 letters => ", "
    }
    let statusId = val.status;
    let statusArr = orderStatus(val.status);
    val.status = '<span class="badge light badge-'+statusArr.cssClass+'">'+statusArr.status+'</span>';
    val.total_price = "₤"+val.total_price;
    val.ordered_date = moment(val.ordered_date).format(process.env.DATE_FORMAT);
    val.created_at = moment(val.created_at).format(process.env.DATE_FORMAT);
    val.action = `
                <a href="/admin/orders/order-detail/`+val.id+`" class="btn btn-sm light btn-primary w-space-no">Detail</a>
                <div class="dropdown custom-dropdown mb-0">
                    <div class="btn sharp btn-primary tp-btn" data-toggle="dropdown">
                        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="18px" height="18px" viewBox="0 0 24 24" version="1.1"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><rect x="0" y="0" width="24" height="24"/><circle fill="#000000" cx="12" cy="5" r="2"/><circle fill="#000000" cx="12" cy="12" r="2"/><circle fill="#000000" cx="12" cy="19" r="2"/></g></svg>
                    </div>
                    <div class="dropdown-menu dropdown-menu-right">
                `;
                if(statusId != 1){
                    val.action += '<a class="dropdown-item text-warning orderStatusBtn" data-status="1" data-order="'+val.id+'" href="javascript:void(0);">Pending</a>';
                }
                if(statusId != 3){
                    val.action += '<a class="dropdown-item text-primary orderStatusBtn" data-status="3" data-order="'+val.id+'" href="javascript:void(0);">Assigned</a>';
                }
                if(statusId != 2){
                    val.action += '<a class="dropdown-item text-success orderStatusBtn" data-status="2" data-order="'+val.id+'" href="javascript:void(0);">Completed</a>';
                }
                if(statusId != 4){
                    val.action += '<a class="dropdown-item text-danger orderStatusBtn" data-status="4" data-order="'+val.id+'" href="javascript:void(0);">Cancelled</a>';
                }
    
    val.action += `</div>
                </div>`;
    return val;
}

exports.listingAccordingFilterPage = (req, res) => {
    let filter = req.params.filter;
    if (filter != "pending" && filter != "assigned" && filter != "cancelled" && filter != "completed") {
        res.status(404).render('errors/404');
    } else {
        let filterTxt = capitalizeWord(filter);
        var passDataToView = {
            page_title: filterTxt + " Order Listing",
            adminSession: req.session.admin,
            sidebarActive: "Orders",
            childSidebarActive: filterTxt+"-orders",
            breadCrumb: ["Home", "Orders", filterTxt + " Orders"],
            sectionTitle: filterTxt + " Orders",
            datatableUrl: "/admin/orders/datatable-filter/" + filter,
        };

        res.render("admin/orders/listing", passDataToView);
    }
}

exports.listingAccordingFilterDatatable = (req, res) => {
    let reqBody = req.body;
    let filter = req.params.filter;
    let statusId = retOrderStatusId(filter);
    dbObj.datatableWithJoinRecords(reqBody, "orders", "orders.*, users.name as user_name", "JOIN users ON orders.user_id=users.id", "orders.status= '" + statusId.status + "'").then(async(data) => {
        let returnData = await orderDTDataStructure(data);
        res.json(returnData);
    });
}

exports.getOrderDetailPage = (req, res) => {
    var passDataToView = {
        page_title: "Order Detail",
        adminSession: req.session.admin,
        sidebarActive: "Orders",
        childSidebarActive: "",
        breadCrumb: ["Home", "Orders", "Order Detail"]
    };
    dbObj.getSingleRecord("SELECT orders.*, users.name as customerName FROM orders JOIN users ON orders.user_id=users.id WHERE orders.id = "+req.params.id).then((data) => {
        if (data.counts > 0) {
            let orderDetail = data.records;
            let statusArr = orderStatus(orderDetail.status);
            orderDetail.statusId = orderDetail.status;
            orderDetail.status = '<span class="badge light badge-'+statusArr.cssClass+'">'+statusArr.status+'</span>';
            orderDetail.total_price = "₤"+orderDetail.total_price;
            orderDetail.ordered_date = moment(orderDetail.ordered_date).format(process.env.DATE_FORMAT);
            orderDetail.created_at = moment(orderDetail.created_at).format(process.env.DATE_FORMAT);

            passDataToView.record = orderDetail;
            dbObj.select("order_services", columns="order_id, service_id, name, price, quantity, payable_amount", {"order_id": orderDetail.id}).then((data2) => {
                passDataToView.services = data2.records;
                passDataToView.googleMapKey = process.env.GOOGLE_MAP_KEY;
                res.render("admin/orders/view", passDataToView);
            });
        } else {
            res.status(404).render('errors/404');
        }
    });
}

exports.orderStatusUpdate = (req, res) => {
    let reqData = req.body;
    let rules = {
        order_id: 'required',
        status_id: 'required',
    };
    let validation = new Validator(reqData, rules);
    if (validation.fails()) {
        returnJson(res, 2, "Validation errors", [], validation.errors.all(), 422);
    } else {
        dbObj.update("orders", { "status": reqData.status_id }, { "id": reqData.order_id });
        returnJson(res, 1, "Order status updated successfully");
    }
}