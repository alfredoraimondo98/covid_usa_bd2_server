const express = require('express');
const router = express.Router();
const airqualityController = require("../controllers/airquality");


router.post('/', airqualityController.getAirQualityData);


module.exports = router;