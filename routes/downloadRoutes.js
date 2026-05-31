const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { downloadQuiz } = require('../controllers/downloadController');

router.get('/:code', protect, downloadQuiz);

module.exports = router;