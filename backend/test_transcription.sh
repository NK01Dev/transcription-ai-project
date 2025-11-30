#!/bin/bash

# AWS Transcribe Quick Test Script
# This script tests the basic transcription workflow

echo "🎙️  AWS Transcribe Test Script"
echo "================================"
echo ""

# Configuration
API_URL="http://localhost:5000/api"
AUDIO_FILE="$1"

# Check if audio file is provided
if [ -z "$AUDIO_FILE" ]; then
    echo "❌ Error: No audio file provided"
    echo ""
    echo "Usage: ./test_transcription.sh /path/to/audio.mp3"
    echo ""
    echo "Supported formats: mp3, wav, m4a, ogg, webm, flac"
    exit 1
fi

# Check if file exists
if [ ! -f "$AUDIO_FILE" ]; then
    echo "❌ Error: File not found: $AUDIO_FILE"
    exit 1
fi

echo "📁 Audio file: $AUDIO_FILE"
echo ""

# Step 1: Upload audio and start transcription
echo "Step 1: Uploading audio file..."
UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/transcriptions/upload" \
  -F "audio=@$AUDIO_FILE" \
  -F "language=en-US")

echo "Response: $UPLOAD_RESPONSE"
echo ""

# Extract transcription ID
TRANSCRIPTION_ID=$(echo $UPLOAD_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TRANSCRIPTION_ID" ]; then
    echo "❌ Error: Failed to upload audio file"
    echo "Response: $UPLOAD_RESPONSE"
    exit 1
fi

echo "✅ Upload successful!"
echo "📝 Transcription ID: $TRANSCRIPTION_ID"
echo ""

# Step 2: Check status (initial)
echo "Step 2: Checking initial status..."
STATUS_RESPONSE=$(curl -s "$API_URL/transcriptions/status/$TRANSCRIPTION_ID")
echo "Response: $STATUS_RESPONSE"
echo ""

# Step 3: Wait and check status again
echo "Step 3: Waiting for transcription to complete..."
echo "⏳ This typically takes 30-120 seconds..."
echo ""

ATTEMPTS=0
MAX_ATTEMPTS=24  # 24 attempts * 5 seconds = 2 minutes

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    sleep 5
    ATTEMPTS=$((ATTEMPTS + 1))
    
    STATUS_RESPONSE=$(curl -s "$API_URL/transcriptions/status/$TRANSCRIPTION_ID")
    STATUS=$(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    echo "Attempt $ATTEMPTS/$MAX_ATTEMPTS - Status: $STATUS"
    
    if [ "$STATUS" = "COMPLETED" ]; then
        echo ""
        echo "✅ Transcription completed!"
        echo ""
        echo "📄 Full Response:"
        echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"
        echo ""
        
        # Extract transcription text
        TRANSCRIPT=$(echo $STATUS_RESPONSE | grep -o '"transcriptionText":"[^"]*"' | cut -d'"' -f4)
        CONFIDENCE=$(echo $STATUS_RESPONSE | grep -o '"confidence":[0-9.]*' | cut -d':' -f2)
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📝 TRANSCRIPTION RESULT"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Text: $TRANSCRIPT"
        echo "Confidence: $CONFIDENCE%"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        exit 0
    elif [ "$STATUS" = "FAILED" ]; then
        echo ""
        echo "❌ Transcription failed!"
        echo ""
        echo "Response: $STATUS_RESPONSE"
        exit 1
    fi
done

echo ""
echo "⏱️  Timeout: Transcription is taking longer than expected"
echo "You can check the status manually:"
echo "curl $API_URL/transcriptions/status/$TRANSCRIPTION_ID"
echo ""
echo "Or check AWS Transcribe console for job details"
