const express = require('express');
const router = express.Router();
const lockdownController = require("../controllers/lockdown");



router.post('/', lockdownController.getLockdownData);


module.exports = router;