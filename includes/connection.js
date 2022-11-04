const mysql = require("mysql");
const DB = require("./db-obj");

var mysqlConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    multipleStatements: true,
});

mysqlConnection.connect((err) => {
    if (err) {
        console.log(err);
    }
});

dbObj = new DB(mysqlConnection);

module.exports = dbObj;