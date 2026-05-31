const Quiz = require('../models/Quiz');

const downloadQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ code: req.params.code }).populate('questions');

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json({
      title: quiz.title,
      genre: quiz.genre,
      questions: quiz.questions
    });

  } catch (err) {
    res.status(500).json({ message: "Download failed" });
  }
};

module.exports = { downloadQuiz };