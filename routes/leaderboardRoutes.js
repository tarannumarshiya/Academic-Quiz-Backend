const express = require('express');
const router = express.Router();
const {
  submitScore,
  getGlobalLeaderboard,
  getQuizLeaderboard,
  getUserAttempts,
} = require('../controllers/leaderboardController');
const { protect } = require('../middleware/authMiddleware');

router.post('/scores', protect, submitScore);
router.get('/scores/user/:userId', protect, getUserAttempts);
router.get('/leaderboard', protect, getGlobalLeaderboard);
router.get('/leaderboard/:quizCode', protect, getQuizLeaderboard);

module.exports = router;
