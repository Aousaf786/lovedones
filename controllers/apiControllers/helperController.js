const { returnApiJson, randomNumber } = require('../../includes/functions');

exports.imageUploading = async(req, res) => {
    let reqFile = req.files;
    let reqType = req.body.type;
    if(reqType == ""){
        returnApiJson(res, 0, "Type is empty");
    }
    if (!reqFile || Object.keys(reqFile).length === 0) {
        returnApiJson(res, 0, "No file was selected");
    } else {
        let storagePath, imgExt, fileName;
        if(reqType == "memorial_img"){
            storagePath = storageBasePath + "/memorial-img/";
            imgExt = reqFile.image.name.split('.').pop().toLowerCase();
            fileName = "memorial-img-" + Date.now() + randomNumber(1, 100000) + "." + imgExt;
        }
        // save image on server
        reqFile.image.mv(storagePath + '/' + fileName, function(err) {
            if (err) {
                returnApiJson(res, 0, err);
            } else {
                returnApiJson(res, 1, "Image uploaded successfully", {data: fileName});
            }
        });
    }
}