const Transcription = require('../models/Transcription');
const s3Service = require('../services/s3.service');
const transcribeService = require('../services/transcribe.service');
const { v4: uuidv4 } = require('uuid');

class TranscriptionController {
  /**
   * Upload audio and start transcription
   */
  async uploadAndTranscribe(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      const language = req.body.language || 'en-US';
      
      // Upload to S3
      const s3Result = await s3Service.uploadAudioFile(req.file);
      
      // Create unique job name
      const jobName = `transcription-${uuidv4()}`;
      
      // Save to database
      const transcription = new Transcription({
        jobName,
        audioFileUrl: s3Result.url,
        language,
        status: 'PENDING',
        metadata: {
          fileName: req.file.originalname,
          fileSize: s3Result.size,
          mimeType: req.file.mimetype
        }
      });

      await transcription.save();

      // Start AWS Transcribe job
      const transcribeJob = await transcribeService.startTranscriptionJob(
        jobName,
        s3Result.url,
        language
      );

      // Update with AWS job ID
      transcription.awsJobId = transcribeJob.TranscriptionJobName;
      transcription.status = 'IN_PROGRESS';
      await transcription.save();

      res.status(201).json({
        message: 'Transcription job started successfully',
        data: {
          id: transcription._id,
          jobName: transcription.jobName,
          status: transcription.status,
          language: transcription.language
        }
      });

    } catch (error) {
      console.error('Upload and transcribe error:', error);
      res.status(500).json({ 
        error: 'Failed to process transcription',
        details: error.message 
      });
    }
  }

  /**
   * Check transcription status
   */
  async checkStatus(req, res) {
    try {
      const { id } = req.params;
      
      const transcription = await Transcription.findById(id);
      
      if (!transcription) {
        return res.status(404).json({ error: 'Transcription not found' });
      }

      // If job is still in progress, check AWS status
      if (transcription.status === 'IN_PROGRESS') {
        const awsJob = await transcribeService.getTranscriptionJob(transcription.jobName);
        
        if (awsJob.TranscriptionJobStatus === 'COMPLETED') {
          // Fetch transcription result
          const result = await transcribeService.getTranscriptionResult(
            awsJob.Transcript.TranscriptFileUri
          );

          transcription.status = 'COMPLETED';
          transcription.transcriptionText = result.transcript;
          transcription.confidence = result.confidence;
          await transcription.save();
          
        } else if (awsJob.TranscriptionJobStatus === 'FAILED') {
          transcription.status = 'FAILED';
          transcription.errorMessage = awsJob.FailureReason;
          await transcription.save();
        }
      }

      res.json({
        data: {
          id: transcription._id,
          jobName: transcription.jobName,
          status: transcription.status,
          transcriptionText: transcription.transcriptionText,
          language: transcription.language,
          confidence: transcription.confidence,
          createdAt: transcription.createdAt,
          updatedAt: transcription.updatedAt,
          metadata: transcription.metadata
        }
      });

    } catch (error) {
      console.error('Check status error:', error);
      res.status(500).json({ 
        error: 'Failed to check transcription status',
        details: error.message 
      });
    }
  }

  /**
   * Get all transcriptions
   */
  async getAllTranscriptions(req, res) {
    try {
      const { status, limit = 20, page = 1 } = req.query;
      
      const query = status ? { status } : {};
      const skip = (page - 1) * limit;

      const transcriptions = await Transcription.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .select('-__v');

      const total = await Transcription.countDocuments(query);

      res.json({
        data: transcriptions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get all transcriptions error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch transcriptions',
        details: error.message 
      });
    }
  }

  /**
   * Delete a transcription
   */
  async deleteTranscription(req, res) {
    try {
      const { id } = req.params;
      
      const transcription = await Transcription.findByIdAndDelete(id);
      
      if (!transcription) {
        return res.status(404).json({ error: 'Transcription not found' });
      }

      res.json({ 
        message: 'Transcription deleted successfully',
        data: { id: transcription._id }
      });

    } catch (error) {
      console.error('Delete transcription error:', error);
      res.status(500).json({ 
        error: 'Failed to delete transcription',
        details: error.message 
      });
    }
  }
}

module.exports = new TranscriptionController();