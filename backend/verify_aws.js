require('dotenv').config();
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const { TranscribeClient, ListTranscriptionJobsCommand } = require('@aws-sdk/client-transcribe');

async function checkAWS() {
    console.log('🔍 Checking AWS Connectivity...');
    console.log(`🌍 Region: ${process.env.AWS_REGION}`);
    console.log(`📦 Configured Bucket: ${process.env.S3_BUCKET}`);

    // Check S3
    try {
        const s3 = new S3Client({ region: process.env.AWS_REGION });
        const data = await s3.send(new ListBucketsCommand({}));
        console.log('\n✅ S3 Connection Successful!');
        console.log(`   Found ${data.Buckets.length} buckets.`);
        const bucketExists = data.Buckets.some(b => b.Name === process.env.S3_BUCKET);
        if (bucketExists) {
            console.log(`   ✅ Configured bucket "${process.env.S3_BUCKET}" found.`);
        } else {
            console.log(`   ⚠️  Configured bucket "${process.env.S3_BUCKET}" NOT found in this account.`);
        }
    } catch (err) {
        console.error('\n❌ S3 Connection Failed:', err.message);
    }

    // Check Transcribe
    try {
        const transcribe = new TranscribeClient({ region: process.env.AWS_REGION });
        const data = await transcribe.send(new ListTranscriptionJobsCommand({ MaxResults: 1 }));
        console.log('\n✅ Transcribe Connection Successful!');
        console.log('   Successfully listed transcription jobs.');
    } catch (err) {
        console.error('\n❌ Transcribe Connection Failed:', err.message);
    }
}

checkAWS();
