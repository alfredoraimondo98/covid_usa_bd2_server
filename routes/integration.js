const express = require('express');
const router = express.Router();
const integrationController = require("../controllers/integration");


router.post('/integrationCitiesAirQuality', integrationController.integrationCitiesAirQuality);

//router.post('/getCovidAndLockdown', integrationController.getCovidAndLockdown);

router.post('/integrationCovidLockdownUS', integrationController.integrationCovidLockdownUS);


router.post('/', integrationController.integrationCovidLockdownAirQuality);



module.exports = router;