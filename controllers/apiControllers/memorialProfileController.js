const Validator = require('validatorjs');
const dbObj = require("../../includes/connection");
const { returnApiJson, randomNumber } = require('../../includes/functions');

memorialProObj = (record, imgArr) => {
    record.profile_image = "";
    record.images = [];
    if(imgArr["index"+record.id] != undefined){
        record.profile_image = imgArr["index"+record.id].profile_image;
        record.images = imgArr["index"+record.id].images;
    }
    // remove extra data
    delete record.user_id;
    // delete record.relation;
    delete record.created_at;
    delete record.updated_at;
    return record;
}

exports.getAllMyMemorialProfiles = (req, res) => {
    let userId = req.session.user.id;
    dbObj.select("memorial_profiles", columns="*", {"user_id": userId}, "id DESC").then(async(data) => {
        let returnData = await memorialProDataStructure(data);
        returnApiJson(res, 1, "Success", { "data": returnData });
    });
}

exports.getMemorialProfileDetail = (req, res) => {
    let reqData = req.body;
    let rules = {
        memorial_id: 'required',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        dbObj.select("memorial_profiles", columns="*", {"id": reqData.memorial_id}, "id DESC LIMIT 1").then(async(data) => {
            if (data.counts > 0) {
                let returnData = await memorialProDataStructure(data);
                returnApiJson(res, 1, "Success", returnData[0]);
            } else {
                returnApiJson(res, 0, "Memorial profile not found");
            }
        });
    }
}

exports.searchMemorialProfile = (req, res) => {
	let userId = req.session.user.id;
    let reqData = req.body;
    let whereCond = "user_id="+userId;
    let supportedKeys = ["first_name", "middle_name", "last_name", "birth_date", "death_date", "cemetery_country", "cemetery_state"];
    let i = 0
    for (let x in reqData) {
        if(supportedKeys.includes(x)){
            whereCond +=  i === 0 ? " AND (" : " OR "
            whereCond += (reqData[x])? x+"='"+reqData[x]+"'": '';
            i++
        }
    }
    // whereCond = whereCond.slice(0, whereCond.length - 4);   // remove last 4 letter => " OR "
	whereCond += i > 0 ? ")" : "" ;
    dbObj.select("memorial_profiles", columns="*", whereCond, "id DESC").then(async(data) => {
        let returnData = await memorialProDataStructure(data);
        returnApiJson(res, 1, "Success", { "data": returnData });
    });
}

memorialProDataStructure = (data) => {
    return new Promise(resolve => {
        if(data.counts == 0){
            resolve([]);
        } else {
            let userArr = "", imgArr = {}, mainImgPath = process.env.APP_URL+"/storage/memorial-img/";
            for(var i=0; i < data.counts; i++) {
                userArr += data.records[i].id+",";
            }
            userArr = userArr.slice(0, userArr.length - 1); // remove last  letter => ","

            dbObj.select("memorial_profile_images", columns="id, memorial_profile_id, img, profile_img", "memorial_profile_id IN ("+userArr+")").then((data2) => {
                data2.records.forEach((val2) => {
                    let uniqueId = val2.memorial_profile_id;
                    if(imgArr["index"+uniqueId] == undefined){
                        imgArr["index"+uniqueId] = {};
                        imgArr["index"+uniqueId].profile_image = "";
                        imgArr["index"+uniqueId].images = [];
                    }
                    if(val2.profile_img == 1){
                        imgArr["index"+uniqueId].profile_image = mainImgPath+val2.img;
                    }
                    imgArr["index"+uniqueId].images.push(mainImgPath+val2.img);
                });

                data.records.forEach((val) => {
                    val = memorialProObj(val, imgArr);
                });
                resolve(data.records);
            });
        }
    });
}

exports.addMemorialProfile = (req, res) => {
    let reqData = {...req.params, ...req.body, ...req.files};
    let rules = {
        relation:"required|in:Dad,Mother",
        first_name: 'required',
        //middle_name: 'required',
        last_name: 'required',
        birth_date: 'required',
        death_date: 'required',
        cemetery_country: 'required',
        cemetery_state: 'required',
        // images: 'required|array',
      };
    let validation = new Validator(reqData, rules);
    if(validation.fails()){
        returnApiJson(res, 2, "Validation errors", null, validation.errors.all());
    } else {
        let userId = req.session.user.id;
        let newData = {
            "user_id": userId,
            "first_name": reqData.first_name,
            "middle_name": reqData.middle_name,
            "last_name": reqData.last_name,
            "birth_date": reqData.birth_date,
            "death_date": reqData.death_date,
            "cemetery_country": reqData.cemetery_country,
            "cemetery_state": reqData.cemetery_state,
            "relation":reqData.relation
        }
        dbObj.insert("memorial_profiles", newData).then((insertData) => {
            if (insertData.response) {
                let insertId = insertData.lastInsertId;
                let imgCount = 1;
                /** Image Upload */
                let reqFile = req.files;
                let storagePath, imgExt, fileName = null;
                [reqFile.images].forEach(element => {
                    let makeProImg = 0;
                    if(imgCount == 1){
                        makeProImg = 1;
                        imgCount++;
                    }
                    if (reqFile && Object.keys(reqFile).length > 0) {
                        storagePath = storageBasePath + "/memorial_profile/";
                        imgExt = reqFile.images.name.split('.').pop().toLowerCase();
                        fileName = "memorial_profile-" + Date.now() + randomNumber(1, 100000) + "." + imgExt;
                        // save image on server
                        reqFile.images.mv(storagePath + '/' + fileName);
                    }
                    dbObj.insert("memorial_profile_images", { "memorial_profile_id": insertId, "img": element, "profile_img": makeProImg });
                });
                returnApiJson(res, 1, "Memorial profile added successfully.");
            }
        });
    }
}