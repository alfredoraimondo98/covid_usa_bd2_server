const express = require('express');
const router = express.Router();
const chartsQueryController = require("../controllers/chartsQuery");


router.post('/getCasesAndDeaths', chartsQueryController.getCasesAndDeaths); //restituisce casi e morti in un range di date per un dato stato

router.post('/getLockdown', chartsQueryController.getLockdown); //restituisce tutti gli stati per cui è presente l'informazione lockdown

router.post('/getReportCases', chartsQueryController.getReportCases); //restituisce un report dei casi (e morti) per un dato stato pre/post lockdown

router.post('/getStateWithLockdown', chartsQueryController.getStateWithLockdown); //restituisce tutti i dati del lockdown per un dato stato

router.post('/getReportAirQuality', chartsQueryController.getReportAirQuality); //restituisce un report della qualità dell'aria per un dato stato pre/post lockdown

router.post('/getReportAirAverage', chartsQueryController.getReportAirAverage); //restituisce un report con una media della qualità dell'aria per le città di uno stato

router.post('/getPercentCasesByState', chartsQueryController.getPercentCasesByState); //restituisce valori di casi totali per tutte le contee di uno stato

router.post('/getStateWithAirQuality', chartsQueryController.getStateWithAirQuality); //restituisce stati con informazioni della qualità dell'aria

router.post('/getAvgQoACity', chartsQueryController.getAvgQoACity); //restituisce la media della qualità dell'aria per tutte le città di un dato stato

router.post('/getCity', chartsQueryController.getCity); //restituisce tutte le città

router.post('/getReportQoAByCity', chartsQueryController.getReportQoAByCity); //restituisce report qualità dell'aria per città



module.exports = router;