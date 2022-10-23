/* 
Script created by Umar (umarphpdev@gmail.com)
*/

class DB {

    constructor(con) {
        this.con = con;
    }

    // exception query for error handling
    catchException(query, exception) {
        if (!this.undefinedCond(query)) {
            let queryObj = {
                "query": query,
                "exception": exception,
            }
            console.log(queryObj);
            this.con.query("INSERT INTO query_exceptions SET ?", queryObj, (err, result) => {
                if (err) {
                    console.log(err);
                    return false;
                } else {
                    return true;
                }
            });
        }
    }

    // convert obj to query for clouse
    objToClouses(obj) {
        var str = '';
        for (var p in obj) {
            if (obj.hasOwnProperty(p)) {
                str += p + ' = "' + obj[p] + '" and ';
            }
        }
        str = str.slice(0, str.length - 5); // remove last 5 letters => " and "
        return str;
    }

    // convert obj to query for column
    objToColumn(obj) {
        var str = '';
        for (var p in obj) {
            if (obj.hasOwnProperty(p)) {
                str += obj[p] + ', ';
            }
        }
        str = str.slice(0, str.length - 2); // remove last 2 letters => ", "
        return str;
    }

    // empty undifined conditions
    undefinedCond(record){
        if(record == "" || record == undefined){
            return true;
        } else {
            return false;
        }
    }

    // queryRun(): Query from MySQL.
    queryRun(query) {
        let returnRes;
        return new Promise(async resolve => {
            if (this.undefinedCond(query)) {
                resolve(false);
                return;
            }
            
            this.con.query(query, (err, result) => {
                if (err) {
                    this.catchException(query, err);
                    returnRes = false;
                } else {
                    returnRes = true;
                }
                resolve(returnRes);
            });
        });
    }

    // getRecords(): Select Records from MySQL.
    getRecords(query) {
        let returnRes = false;
        return new Promise(async resolve => {
            if (this.undefinedCond(query)) {
                resolve(false);
                return;
            }
            
            this.con.query(query, (err, result) => {
                if (err) {
                    this.catchException(query, err);
                    returnRes = { records: [], counts: 0 };
                } else {
                    returnRes = { records: result, counts: result.length };
                }
                resolve(returnRes);
            });
        });
    }

    // getSingleRecord(): Select Single Record from MySQL.
    getSingleRecord(query) {
        let returnRes = false;
        return new Promise(async resolve => {
            if (this.undefinedCond(query)) {
                resolve(false);
                return;
            }
            
            this.con.query(query+" LIMIT 1", (err, result) => {
                if (err) {
                    this.catchException(query, err);
                    returnRes = { records: null, counts: 0 };
                } else {
                    returnRes = { records: result[0], counts: result.length };
                }
                resolve(returnRes);
            });
        });
    }

    // select(): Select rows from the DB with pagination optional
    select(table, columns="*", where="", orderBy="", perPage="", getPaginationPara=false, page=1) {
        return new Promise(async resolve => {
            if (this.undefinedCond(table)) {
                resolve(false);
                return;
            }
            
            // Set up columns
            if(typeof columns == "object"){
                columns = this.objToColumn(columns);
            } else if(columns == ""){
                columns = "*";
            }

            // set up where
            if(where != ""){
                if(typeof where == "object"){
                    where = "WHERE "+this.objToClouses(where);
                } else {
                    where = "WHERE "+where;
                }
            }

            // set up orderBy
            if(orderBy != ""){
                orderBy = "ORDER BY "+orderBy;
            }

            let limit = "";
            if(getPaginationPara){
                // set up limit for pagination
                if(perPage == ""){
                    perPage = 10;
                }
                let startPoint = (page * perPage) - perPage;
                limit = "LIMIT "+startPoint+", "+perPage;
            } else {
                // set up limit
                if(perPage != ""){
                    limit = "LIMIT "+perPage;
                }
            }

            let query = "SELECT "+columns+" FROM "+table+" "+where+" "+orderBy+" "+limit;
            let countQuery = "SELECT COUNT(*) as `num` FROM "+table+" "+where;
            let returnRes = {};
            if(getPaginationPara){
                // pagination parameters
                let countRes = await this.getSingleRecord(countQuery);
                let totalRecords = countRes.records.num;

                returnRes = await this.getRecords(query);
                returnRes.currentPage = page;
                returnRes.totalRecords = totalRecords;
                returnRes.perPage = perPage;
                returnRes.lastPage = Math.ceil(totalRecords/perPage);
            } else {
                returnRes = this.getRecords(query);
            }
            resolve(returnRes);
        });
    }

    // selectRow(): Select a row from the DB
    selectRow(table, columns="*", where="") {
        return new Promise(async resolve => {
            if (this.undefinedCond(table)) {
                resolve(false);
                return;
            }
            
            // Set up columns
            if(typeof columns == "object"){
                columns = this.objToColumn(columns);
            } else if(columns == ""){
                columns = "*";
            }

            // set up where
            if(where != ""){
                if(typeof where == "object"){
                    where = "WHERE "+this.objToClouses(where);
                } else {
                    where = "WHERE "+where;
                }
            }

            let query = "SELECT "+columns+" FROM "+table+" "+where;
            resolve(this.getSingleRecord(query));
        });
    }

    // insert(): Insert data into a table
    insert(table, data) {
        let returnRes = false;
        return new Promise(async resolve => {
            if (this.undefinedCond(table) || this.undefinedCond(data) || typeof data != "object") {
                resolve(false);
                return;
            }
            
            this.con.query("INSERT INTO "+table+" SET ?", data, (err, result) => {
                if (err) {
                    this.catchException("INSERT INTO "+table+" SET "+JSON.stringify(data), err);
                    returnRes = { lastInsertId: null, response: 0};
                } else {
                    returnRes = { lastInsertId: result.insertId, response: 1 };
                }
                resolve(returnRes);
            });
        });
    }

    // update(): Update data into a table
    update(table, data, where) {
        let returnRes = false;
        return new Promise(async resolve => {
            if (this.undefinedCond(table) || this.undefinedCond(data) || typeof data != "object" || this.undefinedCond(where)) {
                resolve(false);
                return;
            } 

            // set up where
            if(typeof where == "object"){
                where = "WHERE "+this.objToClouses(where);
            } else {
                where = "WHERE "+where;
            }

            this.con.query("UPDATE "+table+" SET ? "+where, data, (err, result) => {
                if (err) {
                    this.catchException("UPDATE "+table+" SET "+JSON.stringify(data)+" "+where, err);
                    returnRes = false;
                } else {
                    returnRes = true;
                }
                resolve(returnRes);
            });
        });
    }

    // delete(): Delete a row from a table
    delete(table, where) {
        return new Promise(async resolve => {
            if (this.undefinedCond(table) || this.undefinedCond(where)) {
                resolve(false);
                return;
            } 

            // set up where
            if(typeof where == "object"){
                where = "WHERE "+this.objToClouses(where);
            } else {
                where = "WHERE "+where;
            }

            let query = "DELETE FROM "+table+" "+where;
            resolve(this.queryRun(query));
        });
    }

    // paginationHtml(): use for paginattion html
    paginationHtml(currentPage, lastPage, interval=2, url='?page=', urlSlash='', perPage, totalRecords){
        return new Promise(async resolve => {
            let prevPage = currentPage - 1,
            nextPage = currentPage + 1,
            firstPage = 1,
            counter,
            paginationHtml = "";
            
            let from = currentPage - interval;
            if(from < 1){
                from = 1;
            }
            let to = currentPage + interval;
            if(to > lastPage){
                to = lastPage;
            }

            if(lastPage > 1){
                paginationHtml += "<ul class='pagination'>";
                //paginationHtml += "<li class='pagination_details'>Page "+currentPage+" of "+lastPage+"</li>";

                if (currentPage > 1){
                    paginationHtml += "<li><a href='"+ url + firstPage + urlSlash +"'>&laquo;</a></li>";
                    paginationHtml += "<li><a href='"+ url + prevPage + urlSlash +"'>&lsaquo;</a></li>";
                }

                for (counter = from; counter <= to; counter++){
                    if (counter == currentPage){
                        paginationHtml += "<li><a class='current_page'>"+counter+"</a></li>";
                    } else {
                        paginationHtml += "<li><a href='"+ url + counter + urlSlash +"'>"+counter+"</a></li>";
                    }					
                }

                if (currentPage < lastPage){ 
                    paginationHtml += "<li><a href='"+ url + nextPage + urlSlash +"'>&rsaquo;</a></li>";
                    paginationHtml += "<li><a href='"+ url + lastPage + urlSlash +"'>&raquo;</a></li>";
                }

                paginationHtml += "</ul>";
            }
            resolve(paginationHtml);
        });
    }

    // datatableRecords(): use for datatable records
    datatableRecords(reqBody, table, where="1=1"){
        return new Promise(async resolve => {
            /* Useful request Variables coming from the plugin */
            let draw = reqBody.draw; //counter used by DataTables to ensure that the Ajax returns from server-side processing requests are drawn in sequence by DataTables
            let orderByColumnIndex  = reqBody.order[0].column; // index of the sorting column (0 index based - i.e. 0 is the first record)
            let orderType = reqBody.order[0].dir; // ASC or DESC
            let orderBy = reqBody.columns[orderByColumnIndex].data; //Get name of the sorting column from its index
            let start  = reqBody.start; //Paging first record indicator.
            let length = reqBody.length; //Number of records that the table can display in the current draw

            let allData, totalRecords;
            /* SEARCH CASE : Filtered data */
            if(reqBody.search.value != ""){		
                /* WHERE Clause for searching */
                let i;
                let searchWhere = "";
                for(i=0 ; i < reqBody.columns.length; i++){
                    if(reqBody.columns[i].searchable == "true"){    
                        let column = reqBody.columns[i].data; //we get the name of each column using its index from POST request
                        searchWhere += column+" like '%"+reqBody.search.value+"%' OR ";
                    }
                }
                searchWhere = searchWhere.slice(0, searchWhere.length - 4); // remove last 4 letters => " OR "
                where = "("+searchWhere+") AND "+where;
                /* End WHERE */
            }
            this.getSingleRecord("SELECT COUNT(*) as `totalRec` FROM "+table+" WHERE "+where).then((countRes) => {  //Total record without limit clause (No pagination)
                totalRecords = countRes.records.totalRec;    //Count of search result
                this.select(table, "*", where, orderBy+" "+orderType, start+", "+length).then((data) => {  // SQL Query for search with limit and orderBy clauses
                    allData = data.records;
                    resolve({
                        "draw": parseInt(draw),
                        "recordsTotal": totalRecords,
                        "recordsFiltered": totalRecords,
                        "data": allData,
                    });
                });
            });
        });
    }

    // datatableWithJoinRecords(): use for datatable records with join multiple tables
    datatableWithJoinRecords(reqBody, table, selectRec, joinRelation, where="1=1"){
        return new Promise(async resolve => {
            /* Useful request Variables coming from the plugin */
            let draw = reqBody.draw; //counter used by DataTables to ensure that the Ajax returns from server-side processing requests are drawn in sequence by DataTables
            let orderByColumnIndex  = reqBody.order[0].column; // index of the sorting column (0 index based - i.e. 0 is the first record)
            let orderType = reqBody.order[0].dir; // ASC or DESC
            let orderBy = reqBody.columns[orderByColumnIndex].name; //Get name of the sorting column from its index
            let start  = reqBody.start; //Paging first record indicator.
            let length = reqBody.length; //Number of records that the table can display in the current draw

            let allData, totalRecords;
            /* SEARCH CASE : Filtered data */
            if(reqBody.search.value != ""){		
                /* WHERE Clause for searching */
                let i;
                let searchWhere = "";
                for(i=0 ; i < reqBody.columns.length; i++){
                    if(reqBody.columns[i].searchable == "true"){    
                        let column = reqBody.columns[i].name; //we get the name of each column using its index from POST request
                        searchWhere += column+" like '%"+reqBody.search.value+"%' OR ";
                    }
                }
                searchWhere = searchWhere.slice(0, searchWhere.length - 4); // remove last 4 letters => " OR "
                where = "("+searchWhere+") AND "+where;
                /* End WHERE */
            }
            this.getSingleRecord("SELECT COUNT("+table+".id) as `totalRec` FROM "+table+" "+joinRelation+" WHERE "+where).then((countRes) => {  //Total record without limit clause (No pagination)
                totalRecords = countRes.records.totalRec;    //Count of search result
                this.getRecords("SELECT "+selectRec+" FROM "+table+" "+joinRelation+" WHERE "+where+" ORDER BY "+orderBy+" "+orderType+" LIMIT "+start+", "+length).then((data) => {  // SQL Query for search with limit and orderBy clauses
                    allData = data.records;
                    resolve({
                        "draw": parseInt(draw),
                        "recordsTotal": totalRecords,
                        "recordsFiltered": totalRecords,
                        "data": allData,
                    });
                });
            });
        });
    }
}

module.exports = DB;