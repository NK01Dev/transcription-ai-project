const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

class S3Service {
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-west-1'
    });
    this.bucketName = process.env.S3_BUCKET;
  }

  /**
   * Upload audio file to S3
   */
  async uploadAudioFile(file) {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `audio/${uuidv4()}.${fileExtension}`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: fs.createReadStream(file.path),
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadDate: new Date().toISOString()
        }
      });

      await this.s3Client.send(command);

      // Clean up temp file
      fs.unlinkSync(file.path);

      const fileUrl = `s3://${this.bucketName}/${fileName}`;
      
      return {
        key: fileName,
        url: fileUrl,
        size: file.size
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Generate presigned URL for file access
   */
  async getPresignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  /**
   * Get S3 URI for a file
   */
  getS3Uri(key) {
    return `s3://${this.bucketName}/${key}`;
  }
}

module.exports = new S3Service();