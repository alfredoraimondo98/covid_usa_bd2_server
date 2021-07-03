const express = require('express');
const router = express.Router();
const clearController = require("../controllers/clear");

router.post('/selectAllCovidData', clearController.selectAllCovidData);


router.post('/selectAirQualityUSA', clearController.selectAirQualityUSA);


router.post('/selectLockdownUSA', clearController.selectLockdownUSA);


router.post('/selectCities', clearController.selectCities);


module.exports = router;