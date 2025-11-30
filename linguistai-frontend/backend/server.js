require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } = require('@aws-sdk/client-transcribe');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fetch = require('node-fetch'); // Need to install node-fetch@2 for CommonJS

const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB Schema ---
const transcriptionSchema = new mongoose.Schema({
  userId: String,
  fileName: String,
  s3Key: String,
  jobName: String,
  language: String,
  status: { type: String, enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'QUEUED' },
  text: String,
  createdAt: { type: Date, default: Date.now }
});
const Transcription = mongoose.model('Transcription', transcriptionSchema);

// --- AWS Config ---
const s3Client = new S3Client({ 
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const transcribeClient = new TranscribeClient({ 
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// --- Multer (Memory Storage) ---
const upload = multer({ storage: multer.memoryStorage() });

// --- Routes ---

// 1. Upload & Start Job
app.post('/api/transcriptions/upload', upload.single('audio'), async (req, res) => {
    try {
        const file = req.file;
        const language = req.body.language || 'en-US';
        const userId = "demo-user"; // Replace with req.user.id from middleware

        if (!file) return res.status(400).json({ message: "No file provided" });

        const s3Key = `uploads/${Date.now()}_${file.originalname}`;
        const jobName = `transcribe_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // 1. Upload to S3
        await s3Client.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype
        }));

        // 2. Start Transcription Job
        const s3Uri = `s3://${process.env.S3_BUCKET_NAME}/${s3Key}`;
        await transcribeClient.send(new StartTranscriptionJobCommand({
            TranscriptionJobName: jobName,
            LanguageCode: language,
            Media: { MediaFileUri: s3Uri },
            OutputBucketName: process.env.S3_BUCKET_NAME, // Save result to S3
            OutputKey: `${s3Key}.json` // Specific output path
        }));

        // 3. Save DB Record
        const record = await Transcription.create({
            userId,
            fileName: file.originalname,
            s3Key,
            jobName,
            language,
            status: 'PROCESSING'
        });

        res.json(record);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// 2. Check Status & Sync
app.get('/api/transcriptions/status/:id', async (req, res) => {
    try {
        const record = await Transcription.findById(req.params.id);
        if (!record) return res.status(404).json({ message: "Record not found" });

        if (record.status === 'COMPLETED' || record.status === 'FAILED') {
            return res.json(record);
        }

        // Poll AWS
        const jobData = await transcribeClient.send(new GetTranscriptionJobCommand({
            TranscriptionJobName: record.jobName
        }));

        const jobStatus = jobData.TranscriptionJob.TranscriptionJobStatus;

        if (jobStatus === 'COMPLETED') {
            // Download Transcript JSON from S3
            // Note: If OutputBucketName was not set, TranscriptFileUri is a temporary presigned URL.
            // Since we set OutputBucketName, the file is in our bucket.
            
            const transcriptKey = `${record.s3Key}.json`;
            const getObject = await s3Client.send(new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: transcriptKey
            }));
            
            const streamToString = (stream) => new Promise((resolve, reject) => {
              const chunks = [];
              stream.on("data", (chunk) => chunks.push(chunk));
              stream.on("error", reject);
              stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
            });

            const jsonContent = await streamToString(getObject.Body);
            const parsed = JSON.parse(jsonContent);
            const transcriptText = parsed.results.transcripts[0].transcript;

            record.status = 'COMPLETED';
            record.text = transcriptText;
            await record.save();

        } else if (jobStatus === 'FAILED') {
            record.status = 'FAILED';
            await record.save();
        }

        res.json(record);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// 3. Get All
app.get('/api/transcriptions', async (req, res) => {
    try {
        const records = await Transcription.find().sort({ createdAt: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Server Start ---
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB Connected');
        app.listen(process.env.PORT || 5000, () => console.log('Server running on port 5000'));
    })
    .catch(err => console.error(err));
