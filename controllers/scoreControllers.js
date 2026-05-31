const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Score = require('../models/Score');

// @desc    Submit quiz attempt
// @route   POST /api/quizzes/:code/attempt
// @access  Private (Student only)
const submitQuiz = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { answers } = req.body;

    // 🔒 Only students can attempt
    if (req.user.role !== 'student') {
      return res.status(403).json({
        message: 'Only students can attempt quizzes',
      });
    }

    // Find quiz
    const quiz = await Quiz.findOne({ code }).populate('questions');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    let score = 0;

    // Evaluate answers
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctOption) {
        score++;
      }
    });

    const totalQuestions = quiz.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    // Save result in Score collection
    const result = await Score.create({
      user: req.user._id,
      username: req.user.username,
      quiz: quiz._id,
      quizTitle: quiz.title,
      genre: quiz.genre,
      score,
      totalQuestions,
      percentage,
    });

    res.status(201).json({
      message: 'Quiz submitted successfully',
      result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student scorecard
// @route   GET /api/attempts/my-scores
// @access  Private (Student only)
const getMyScores = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        message: 'Only students can view scorecard',
      });
    }

    const scores = await Score.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('quiz', 'title genre');

    res.json(scores);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitQuiz,
  getMyScores,
};