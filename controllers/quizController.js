const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Score = require('../models/Score');

// Helper to generate a unique room code
const generateRoomCode = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let isUnique = false;
  let code = '';

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const exists = await Quiz.findOne({ code });
    if (!exists) {
      isUnique = true;
    }
  }

  return code;
};

// @desc    Create a new quiz room with questions
// @route   POST /api/quizzes
// @access  Private (Lecturer only)
const createQuiz = async (req, res, next) => {
  const { title, description, genre, timeLimit, questions } = req.body;

  try {
    // 🔒 ROLE CHECK (extra security layer)
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({
        message: 'Access denied. Only lecturers can create quizzes.',
      });
    }

    if (!title || !genre || !questions || !Array.isArray(questions) || questions.length === 0) {
      res.status(400);
      throw new Error('Please provide title, genre, and at least one question');
    }

    // Step 1: Create all questions in the db
    const questionIds = [];
    for (const q of questions) {
      if (!q.questionText || !q.options || q.options.length !== 4 || q.correctOption === undefined) {
        res.status(400);
        throw new Error('Each question must have text, exactly 4 options, and a correct option index');
      }

      const newQuestion = await Question.create({
        questionText: q.questionText,
        options: q.options,
        correctOption: q.correctOption,
      });

      questionIds.push(newQuestion._id);
    }

    // Step 2: Generate a room code
    const roomCode = await generateRoomCode();

    // Step 3: Create the quiz
    const quiz = await Quiz.create({
      title,
      description,
      genre,
      timeLimit: timeLimit || 30,
      code: roomCode,
      creator: req.user._id,
      questions: questionIds,
    });

    const populatedQuiz = await Quiz.findById(quiz._id).populate('questions');

    res.status(201).json({
      id: populatedQuiz.code,
      _id: populatedQuiz._id,
      title: populatedQuiz.title,
      description: populatedQuiz.description,
      genre: populatedQuiz.genre,
      timeLimit: populatedQuiz.timeLimit,
      code: populatedQuiz.code,
      questions: populatedQuiz.questions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all quizzes (list metadata)
// @route   GET /api/quizzes
// @access  Public
const getAllQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({})
      .populate('creator', 'username');

    res.json(quizzes);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single quiz by room code or MongoDB ID
// @route   GET /api/quizzes/:code
// @access  Public
const getQuizByCode = async (req, res, next) => {
  const { code } = req.params;

  try {
    let quiz = await Quiz.findOne({ code: code.toUpperCase() }).populate('questions');

    if (!quiz && code.match(/^[0-9a-fA-F]{24}$/)) {
      quiz = await Quiz.findById(code).populate('questions');
    }

    if (!quiz) {
      res.status(404);
      throw new Error(`Quiz room "${code}" not found.`);
    }

    res.json({
      id: quiz.code,
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      genre: quiz.genre,
      timeLimit: quiz.timeLimit,
      code: quiz.code,
      questions: quiz.questions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing quiz room with questions
// @route   PUT /api/quizzes/:code
// @access  Private (Lecturer only)
const updateQuiz = async (req, res, next) => {
  const { code } = req.params;
  const { title, description, genre, timeLimit, questions } = req.body;

  try {
    const quiz = await Quiz.findOne({ code: code.toUpperCase() });

    if (!quiz) {
      res.status(404);
      throw new Error(`Quiz room "${code}" not found.`);
    }

    // 🔒 Creator check
    if (quiz.creator.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied. You can only edit your own quizzes.');
    }

    if (!title || !genre || !questions || !Array.isArray(questions) || questions.length === 0) {
      res.status(400);
      throw new Error('Please provide title, genre, and at least one question');
    }

    // Step 1: Delete all old questions associated with this quiz
    await Question.deleteMany({ _id: { $in: quiz.questions } });

    // Step 2: Create new questions
    const questionIds = [];
    for (const q of questions) {
      if (!q.questionText || !q.options || q.options.length !== 4 || q.correctOption === undefined) {
        res.status(400);
        throw new Error('Each question must have text, exactly 4 options, and a correct option index');
      }

      const newQuestion = await Question.create({
        questionText: q.questionText,
        options: q.options,
        correctOption: q.correctOption,
      });

      questionIds.push(newQuestion._id);
    }

    // Step 3: Update quiz fields
    quiz.title = title;
    quiz.description = description;
    quiz.genre = genre;
    quiz.timeLimit = timeLimit || 30;
    quiz.questions = questionIds;

    const updatedQuiz = await quiz.save();

    res.json({
      message: 'Quiz updated successfully',
      code: updatedQuiz.code,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a quiz, its questions, and its score attempts
// @route   DELETE /api/quizzes/:code
// @access  Private (Lecturer only)
const deleteQuiz = async (req, res, next) => {
  const { code } = req.params;

  try {
    const quiz = await Quiz.findOne({ code: code.toUpperCase() });

    if (!quiz) {
      res.status(404);
      throw new Error(`Quiz room "${code}" not found.`);
    }

    // 🔒 Creator check
    if (quiz.creator.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied. You can only delete your own quizzes.');
    }

    // Step 1: Delete questions
    await Question.deleteMany({ _id: { $in: quiz.questions } });

    // Step 2: Delete score attempts
    await Score.deleteMany({ quiz: quiz._id });

    // Step 3: Delete quiz itself
    await Quiz.deleteOne({ _id: quiz._id });

    res.json({
      message: 'Quiz deleted successfully',
      code: code.toUpperCase(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuiz,
  getAllQuizzes,
  getQuizByCode,
  updateQuiz,
  deleteQuiz,
};