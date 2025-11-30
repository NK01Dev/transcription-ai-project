const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pass', 'fail'],
    default: 'pass' // Assuming "passe exam" implies success, or we can calculate based on score
  },
  examDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Result', resultSchema);
