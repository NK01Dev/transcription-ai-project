const mongoose = require('mongoose');

const transcriptionSchema = new mongoose.Schema({
  jobName: {
    type: String,
    required: true,
    unique: true
  },
  audioFileUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  transcriptionText: {
    type: String,
    default: null
  },
  language: {
    type: String,
    default: 'en-US'
  },
  duration: {
    type: Number,
    default: null
  },
  confidence: {
    type: Number,
    default: null
  },
  metadata: {
    fileName: String,
    fileSize: Number,
    mimeType: String
  },
  awsJobId: {
    type: String,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
transcriptionSchema.index({ status: 1, createdAt: -1 });


module.exports = mongoose.model('Transcription', transcriptionSchema);