const express = require('express');
const router = express.Router();
const chartsQueryController = require("../controllers/chartsQuery");


router.post('/getCasesAndDeaths', chartsQueryController.getCasesAndDeaths);


module.exports = router;