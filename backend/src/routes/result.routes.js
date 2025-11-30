const express = require('express');
const router = express.Router();
const { submitResult, getAllResults, getMyResults } = require('../controllers/result.controller');
const { protect, admin } = require('../middleware/auth.middleware');

router.post('/submit', protect, submitResult);
router.get('/', protect, admin, getAllResults);
router.get('/my', protect, getMyResults);

module.exports = router;
