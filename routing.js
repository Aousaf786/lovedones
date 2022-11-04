const express = require("express");
const Router = express.Router();

// admin routing path
const adminAuthPages = require("./routes/admin/auth");
const adminDashboardPages = require("./routes/admin/dashboard");
const adminUserPages = require("./routes/admin/users");
const adminServicePages = require("./routes/admin/services");
const adminOrderPages = require("./routes/admin/orders");
const adminChatPages = require("./routes/admin/chats");
const adminReminderPages = require("./routes/admin/reminders");
const adminEventPages = require("./routes/admin/event")
// api routing path
const apiAuthRequests = require("./routes/api/auth");
const apiDashboardRequests = require("./routes/api/dashboard");
const apiServiceRequests = require("./routes/api/service");
const apiOrderRequests = require("./routes/api/order");
const apiChatRequests = require("./routes/api/chat");
const apiPaymentRequests = require("./routes/api/payment");
const apiFamilyRequests = require("./routes/api/family");
const apiMemorialProfileRequests = require("./routes/api/memorial_profile");
const apiHelperRequests = require("./routes/api/helper");
const apiReminderRequests = require("./routes/api/reminder");
const apiDiaryRequests = require("./routes/api/diary");
const apiEventRequests = require("./routes/api/event")
// front site routing
Router.get('/', (req, res) => {
    res.redirect('/admin');
});

// admin routings
Router.use('/admin', adminAuthPages);
Router.use('/admin', adminDashboardPages);
Router.use('/admin/users', adminUserPages);
Router.use('/admin/services', adminServicePages);
Router.use('/admin/orders', adminOrderPages);
Router.use('/admin/chats', adminChatPages);
Router.use('/admin/reminders', adminReminderPages);
Router.use('/admin/events', adminEventPages);

// api routings
Router.use('/api/v1', apiAuthRequests);
Router.use('/api/v1', apiDashboardRequests);
Router.use('/api/v1', apiServiceRequests);
Router.use('/api/v1', apiOrderRequests);
Router.use('/api/v1', apiChatRequests);
Router.use('/api/v1', apiPaymentRequests);
Router.use('/api/v1', apiFamilyRequests);
Router.use('/api/v1', apiMemorialProfileRequests);
Router.use('/api/v1', apiHelperRequests);
Router.use('/api/v1', apiReminderRequests);
Router.use('/api/v1', apiDiaryRequests);
Router.use("/api/v1", apiEventRequests)
module.exports = Router;