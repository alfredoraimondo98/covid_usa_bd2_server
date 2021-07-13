const express = require('express');
const router = express.Router();
const homepageController = require("../controllers/homepage");

router.post('/getState', homepageController.getState);
router.post('/getCounty', homepageController.getCounty);
router.post('/getCity', homepageController.getCity);
router.post('/getStateWithLockdown', homepageController.getStateWithLockdown);


module.exports = router;