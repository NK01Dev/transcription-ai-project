const { 
  TranscribeClient, 
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand 
} = require('@aws-sdk/client-transcribe');

class TranscribeService {
  constructor() {
    this.transcribeClient = new TranscribeClient({
      region: process.env.AWS_REGION || 'eu-west-1'
    });
  }

  /**
   * Start a transcription job
   */
  async startTranscriptionJob(jobName, audioFileUri, languageCode = 'en-US') {
    try {
      const command = new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: languageCode,
        MediaFormat: this.getMediaFormat(audioFileUri),
        Media: {
          MediaFileUri: audioFileUri
        },
        OutputBucketName: process.env.S3_BUCKET,
        Settings: {
          ShowSpeakerLabels: true,
          MaxSpeakerLabels: 5
        }
      });

      const response = await this.transcribeClient.send(command);
      return response.TranscriptionJob;
    } catch (error) {
      console.error('Transcribe start job error:', error);
      throw new Error(`Failed to start transcription job: ${error.message}`);
    }
  }

  /**
   * Get transcription job status
   */
  async getTranscriptionJob(jobName) {
    try {
      const command = new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName
      });

      const response = await this.transcribeClient.send(command);
      return response.TranscriptionJob;
    } catch (error) {
      console.error('Get transcription job error:', error);
      throw new Error(`Failed to get transcription job: ${error.message}`);
    }
  }

  /**
   * Fetch transcription result from S3
   */
  async getTranscriptionResult(transcriptFileUri) {
    try {
      const response = await fetch(transcriptFileUri);
      const data = await response.json();
      
      return {
        transcript: data.results.transcripts[0].transcript,
        items: data.results.items,
        confidence: this.calculateAverageConfidence(data.results.items)
      };
    } catch (error) {
      console.error('Fetch transcription result error:', error);
      throw new Error(`Failed to fetch transcription result: ${error.message}`);
    }
  }

  /**
   * Determine media format from file URI
   */
  getMediaFormat(fileUri) {
    const extension = fileUri.split('.').pop().toLowerCase();
    const formatMap = {
      'mp3': 'mp3',
      'mp4': 'mp4',
      'wav': 'wav',
      'flac': 'flac',
      'ogg': 'ogg',
      'amr': 'amr',
      'webm': 'webm',
      'm4a': 'mp4'
    };
    return formatMap[extension] || 'mp3';
  }

  /**
   * Calculate average confidence score
   */
  calculateAverageConfidence(items) {
    const confidenceItems = items.filter(item => item.type === 'pronunciation');
    if (confidenceItems.length === 0) return null;

    const sum = confidenceItems.reduce((acc, item) => {
      return acc + parseFloat(item.alternatives[0].confidence);
    }, 0);

    return (sum / confidenceItems.length * 100).toFixed(2);
  }
}

module.exports = new TranscribeService();