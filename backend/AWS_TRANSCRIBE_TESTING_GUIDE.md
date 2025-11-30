# 🎙️ AWS Transcribe Voice Testing Guide

Complete guide to test your voice transcription application using AWS Transcribe.

---

## ⚠️ Critical Issue Found

**CORS is currently disabled** in your `server.js` (line 11 is commented out). This will **block all frontend requests**!

### Fix Required:

```javascript
// In src/server.js, uncomment line 11:
app.use(cors());
```

Or for production, use specific origins:

```javascript
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"], // Add your frontend URLs
    credentials: true,
  })
);
```

---

## 📋 Prerequisites Checklist

### 1. AWS Account Setup

- [ ] AWS Account created
- [ ] IAM User created with programmatic access
- [ ] Required permissions attached:
  - `AmazonS3FullAccess` (or custom S3 policy)
  - `AmazonTranscribeFullAccess` (or custom Transcribe policy)

### 2. AWS S3 Bucket

- [ ] S3 bucket created (note the bucket name)
- [ ] Bucket region matches `AWS_REGION` in `.env`
- [ ] Bucket permissions allow:
  - PutObject (for uploads)
  - GetObject (for downloads)
  - Public access blocked (recommended)

### 3. Environment Variables

Your `.env` file should have:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/transcription-db

# JWT
JWT_SECRET=your-secret-key-here

# Server
PORT=5000

# AWS Configuration
AWS_REGION=eu-west-1              # Your AWS region
AWS_ACCESS_KEY_ID=AKIA...         # Your AWS access key
AWS_SECRET_ACCESS_KEY=...         # Your AWS secret key
S3_BUCKET=your-bucket-name        # Your S3 bucket name
```

> **Security Note**: Never commit `.env` to Git! It's already in `.gitignore`.

---

## 🔧 AWS Configuration Steps

### Step 1: Create IAM User

1. Go to AWS Console → IAM → Users → Add User
2. User name: `transcription-app-user`
3. Access type: ✅ Programmatic access
4. Attach policies:
   - `AmazonS3FullAccess`
   - `AmazonTranscribeFullAccess`
5. Save the **Access Key ID** and **Secret Access Key**

### Step 2: Create S3 Bucket

1. Go to AWS Console → S3 → Create bucket
2. Bucket name: `transcription-audio-files-[your-name]` (must be globally unique)
3. Region: Select your preferred region (e.g., `eu-west-1`)
4. Block all public access: ✅ Enabled (recommended)
5. Create bucket

### Step 3: Update Environment Variables

```bash
# Update your .env file
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=transcription-audio-files-yourname
```

### Step 4: Test AWS Connectivity

```bash
# In backend directory
node -e "
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({ region: process.env.AWS_REGION });
s3.send(new ListBucketsCommand({}))
  .then(data => console.log('✅ AWS Connected! Buckets:', data.Buckets.map(b => b.Name)))
  .catch(err => console.error('❌ AWS Error:', err.message));
"
```

---

## 🧪 Testing Workflow

### Test 1: Upload Audio File

**Using cURL:**

```bash
curl -X POST http://localhost:5000/api/transcriptions/upload \
  -F "audio=@/path/to/your/audio.mp3" \
  -F "language=en-US"
```

**Using Postman:**

1. Method: `POST`
2. URL: `http://localhost:5000/api/transcriptions/upload`
3. Body → form-data:
   - Key: `audio` (Type: File)
   - Value: Select your audio file
   - Key: `language` (Type: Text)
   - Value: `en-US`

**Expected Response:**

```json
{
  "message": "Transcription job started successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "jobName": "transcription-abc-123",
    "status": "IN_PROGRESS",
    "language": "en-US"
  }
}
```

**What happens:**

1. ✅ File uploaded to S3 (`audio/uuid.mp3`)
2. ✅ Transcription job started in AWS Transcribe
3. ✅ Record saved in MongoDB with status `IN_PROGRESS`

---

### Test 2: Check Transcription Status

**Using cURL:**

```bash
# Replace {id} with the ID from Test 1 response
curl http://localhost:5000/api/transcriptions/status/507f1f77bcf86cd799439011
```

**Expected Response (In Progress):**

```json
{
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "jobName": "transcription-abc-123",
    "status": "IN_PROGRESS",
    "transcriptionText": null,
    "language": "en-US",
    "confidence": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:30.000Z"
  }
}
```

**Expected Response (Completed):**

```json
{
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "jobName": "transcription-abc-123",
    "status": "COMPLETED",
    "transcriptionText": "Hello, this is a test transcription.",
    "language": "en-US",
    "confidence": 98.5,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:02:15.000Z",
    "metadata": {
      "fileName": "test-audio.mp3",
      "fileSize": 1024000,
      "mimeType": "audio/mpeg"
    }
  }
}
```

> **Note**: Transcription typically takes 30 seconds to 2 minutes depending on audio length.

---

### Test 3: List All Transcriptions

**Using cURL:**

```bash
curl "http://localhost:5000/api/transcriptions?page=1&limit=10&status=COMPLETED"
```

**Expected Response:**

```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "jobName": "transcription-abc-123",
      "status": "COMPLETED",
      "transcriptionText": "Hello, this is a test...",
      "language": "en-US",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

---

### Test 4: Delete Transcription

**Using cURL:**

```bash
curl -X DELETE http://localhost:5000/api/transcriptions/507f1f77bcf86cd799439011
```

**Expected Response:**

```json
{
  "message": "Transcription deleted successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011"
  }
}
```

---

## 🎵 Sample Audio Files

### Recommended Test Audio

1. **Short Test (5-10 seconds)**

   - Record yourself saying: "Hello, this is a test of the transcription system."
   - Format: MP3, WAV
   - Use for quick testing

2. **Medium Test (30-60 seconds)**

   - Read a paragraph from a book or article
   - Tests accuracy and confidence scoring

3. **Multi-Speaker Test**
   - Conversation between 2-3 people
   - Tests speaker labeling feature (enabled in your config)

### Creating Test Audio

**Using macOS:**

```bash
# Record 10 seconds of audio
sox -d test-audio.wav trim 0 10
```

**Using Windows:**

- Use Voice Recorder app
- Export as MP3 or M4A

**Using Linux:**

```bash
# Record with arecord
arecord -d 10 -f cd test-audio.wav
```

### Supported Formats

Your app supports:

- ✅ MP3 (`.mp3`)
- ✅ WAV (`.wav`)
- ✅ MP4/M4A (`.mp4`, `.m4a`)
- ✅ OGG (`.ogg`)
- ✅ WebM (`.webm`)
- ✅ FLAC (`.flac`)

Max file size: **100MB**

---

## 🌍 Supported Languages

AWS Transcribe supports 100+ languages. Common ones:

| Language           | Code    |
| ------------------ | ------- |
| English (US)       | `en-US` |
| English (UK)       | `en-GB` |
| French             | `fr-FR` |
| Spanish            | `es-ES` |
| German             | `de-DE` |
| Arabic             | `ar-SA` |
| Chinese (Mandarin) | `zh-CN` |

[Full list of supported languages](https://docs.aws.amazon.com/transcribe/latest/dg/supported-languages.html)

---

## 🔍 Monitoring & Debugging

### Check Backend Logs

```bash
# In backend directory
tail -f server.log
```

Look for:

- ✅ `✅ Connected to MongoDB`
- ✅ `🚀 Server running on port 5000`
- ✅ `☁️ AWS Region: eu-west-1`
- ✅ `📦 S3 Bucket: your-bucket-name`

### Check AWS Transcribe Console

1. Go to AWS Console → Amazon Transcribe
2. Click "Transcription jobs"
3. Find your job by name (e.g., `transcription-abc-123`)
4. Check status and view details

### Check S3 Bucket

1. Go to AWS Console → S3
2. Open your bucket
3. Navigate to `audio/` folder
4. Verify uploaded files are present

---

## 🐛 Troubleshooting

### Issue: "CORS Error" in Frontend

**Cause**: CORS is disabled in `server.js`

**Fix**:

```javascript
// Uncomment in src/server.js
app.use(cors());
```

---

### Issue: "AWS credentials not found"

**Symptoms**:

```
Error: Missing credentials in config
```

**Fix**:

1. Verify `.env` file has `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
2. Restart backend server: `npm run dev`
3. Check credentials are valid in AWS Console

---

### Issue: "Access Denied" when uploading to S3

**Symptoms**:

```
Failed to upload file to S3: Access Denied
```

**Fix**:

1. Verify IAM user has `s3:PutObject` permission
2. Check bucket name in `.env` matches actual bucket
3. Verify bucket region matches `AWS_REGION`

---

### Issue: "Transcription job failed"

**Symptoms**:

```json
{
  "status": "FAILED",
  "errorMessage": "..."
}
```

**Common Causes**:

1. **Invalid audio format**: Use supported formats (MP3, WAV, etc.)
2. **Audio too short**: Minimum 0.5 seconds
3. **Corrupted file**: Try different audio file
4. **Unsupported language**: Check language code

**Debug**:

```bash
# Check AWS Transcribe console for detailed error
# AWS Console → Transcribe → Jobs → [your-job-name]
```

---

### Issue: "Cannot read property 'data'"

**Cause**: Response format mismatch

**Fix**: Remember transcription endpoints use wrapped responses:

```javascript
const response = await fetch("/api/transcriptions/upload");
const transcriptionId = response.data.data.id; // Double .data
```

---

## 📊 Expected Costs

AWS Transcribe pricing (as of 2024):

- **First 60 minutes/month**: FREE
- **After that**: $0.024 per minute ($1.44 per hour)

S3 Storage:

- **First 50 TB/month**: $0.023 per GB
- Audio files are small, expect < $0.10/month for testing

**Recommendation**: Stay within free tier for testing (< 60 min/month)

---

## ✅ Complete Testing Checklist

- [ ] CORS enabled in backend
- [ ] AWS credentials configured in `.env`
- [ ] S3 bucket created and accessible
- [ ] Backend server running (`npm run dev`)
- [ ] MongoDB connected
- [ ] Test audio file prepared
- [ ] Upload test successful (Test 1)
- [ ] Status check shows IN_PROGRESS (Test 2)
- [ ] Wait 30-120 seconds
- [ ] Status check shows COMPLETED with text (Test 2)
- [ ] List transcriptions works (Test 3)
- [ ] Delete transcription works (Test 4)
- [ ] Check AWS Console shows job completed
- [ ] Check S3 bucket contains audio file

---

## 🚀 Next Steps

1. **Fix CORS** - Uncomment `app.use(cors())` in `server.js`
2. **Configure AWS** - Set up IAM user and S3 bucket
3. **Test Backend** - Use Postman or cURL to test all endpoints
4. **Build Frontend** - Use the React integration guide
5. **Deploy** - Consider AWS EC2, Elastic Beanstalk, or Vercel

---

**Need Help?**

- AWS Transcribe Docs: https://docs.aws.amazon.com/transcribe/
- AWS SDK for JavaScript: https://docs.aws.amazon.com/sdk-for-javascript/
- Your API Documentation: `API_TESTING_AND_FRONTEND_GUIDE.md`
