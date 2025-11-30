const express = require('express');
const multer = require('multer');
const transcriptionController = require('../controllers/transcription.controller');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/mp4',
      'audio/x-m4a',
      'audio/ogg',
      'audio/webm',
      'audio/flac'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// Routes
router.post('/upload', upload.single('audio'), transcriptionController.uploadAndTranscribe);
router.get('/status/:id', transcriptionController.checkStatus);
router.get('/', transcriptionController.getAllTranscriptions);
router.delete('/:id', transcriptionController.deleteTranscription);

module.exports = router;