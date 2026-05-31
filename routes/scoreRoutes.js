const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const {
  submitQuiz,
  getMyScores,
} = require('../controllers/scoreControllers');

// Student submits quiz
router.post(
  '/quizzes/:code/attempt',
  protect,
  authorize('student'),
  submitQuiz
);

// Student scorecard
router.get(
  '/my-scores',
  protect,
  authorize('student'),
  getMyScores
);

module.exports = router;