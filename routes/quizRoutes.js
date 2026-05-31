const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getAllQuizzes,
  getQuizByCode,
  updateQuiz,
  deleteQuiz,
} = require('../controllers/quizController');

const { protect } = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

// 🔵 Lecturer only - create quiz, logged-in user - get all quizzes
router.route('/')
  .post(protect, authorize('lecturer'), createQuiz)
  .get(protect, getAllQuizzes);

// 🔵 Logged-in users can view quiz, lecturer can update/delete their quiz
router.route('/:code')
  .get(protect, getQuizByCode)
  .put(protect, authorize('lecturer'), updateQuiz)
  .delete(protect, authorize('lecturer'), deleteQuiz);

module.exports = router;