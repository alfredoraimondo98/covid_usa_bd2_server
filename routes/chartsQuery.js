const express = require('express');
const router = express.Router();
const chartsQueryController = require("../controllers/chartsQuery");


router.post('/getCasesAndDeaths', chartsQueryController.getCasesAndDeaths);

router.post('/getCasesTwoStates', chartsQueryController.getCasesTwoStates);

router.post('/getLockdown', chartsQueryController.getLockdown);

router.post('/getReportCases', chartsQueryController.getReportCases);

router.post('/getStateWithLockdown', chartsQueryController.getStateWithLockdown);

module.exports = router;