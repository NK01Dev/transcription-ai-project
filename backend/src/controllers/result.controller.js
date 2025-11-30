const Result = require('../models/Result');

exports.submitResult = async (req, res) => {
  try {
    const { score } = req.body;

    if (!score && score !== 0) {
      return res.status(400).json({ message: 'Score is required' });
    }

    const result = await Result.create({
      user: req.user.id,
      score,
      status: score >= 50 ? 'pass' : 'fail' // Simple logic for pass/fail
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllResults = async (req, res) => {
  try {
    const results = await Result.find().populate('user', 'name email');
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ user: req.user.id });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
