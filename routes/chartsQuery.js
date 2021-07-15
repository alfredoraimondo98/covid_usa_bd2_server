const express = require('express');
const router = express.Router();
const chartsQueryController = require("../controllers/chartsQuery");


router.post('/getCasesAndDeaths', chartsQueryController.getCasesAndDeaths); //restituisce casi e morti in un range di date per un dato stato

router.post('/getCasesTwoStates', chartsQueryController.getCasesTwoStates); //NOT FOUND

router.post('/getLockdown', chartsQueryController.getLockdown); //restituisce tutti gli stati per cui è presente l'informazione lockdown

router.post('/getReportCases', chartsQueryController.getReportCases); //restituisce un report dei casi (e morti) per un dato stato pre/post lockdown

router.post('/getStateWithLockdown', chartsQueryController.getStateWithLockdown); //restituisce tutti i dati del lockdown per un dato stato

router.post('/getReportAirQuality', chartsQueryController.getReportAirQuality); //restituisce un report della qualità dell'aria per un dato stato pre/post lockdown

router.post('/getReportAirAverage', chartsQueryController.getReportAirAverage); //restituisce un report con una media della qualità dell'aria per le città di uno stato


module.exports = router;