const express = require('express');
const router = express.Router();
const integrationQueryController = require("../controllers/integrationQuery");

router.post('/', integrationQueryController.getAllData);


module.exports = router;