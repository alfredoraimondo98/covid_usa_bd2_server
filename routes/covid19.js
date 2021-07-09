const express = require('express');
const router = express.Router();
const covid19Controller = require("../controllers/covid19");

router.post('/', covid19Controller.getCovidData);


module.exports = router;