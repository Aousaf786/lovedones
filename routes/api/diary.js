const express = require("express");
const Router = express.Router();

const diaryCont = require("../../controllers/apiControllers/diaryController");
const { checkApiSession } = require('../../includes/middlewares');

Router.post("/get-all-diary-data", [ checkApiSession ], diaryCont.getAllDiaryData);

Router.post("/add-diary-data", [ checkApiSession ], diaryCont.addDiaryData);

Router.post("/get-diary-data", [ checkApiSession ], diaryCont.getDiaryData);

Router.post("/update-diary-data", [ checkApiSession ], diaryCont.updateDiaryData);


module.exports = Router;