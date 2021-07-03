const express = require('express');
const router = express.Router();
const integrationController = require("../controllers/integration");


router.post('/integrationCitiesAirQuality', integrationController.integrationCitiesAirQuality);


router.post('/', integrationController.integrationCovidLockdownUS);



module.exports = router;