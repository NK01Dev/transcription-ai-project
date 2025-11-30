#!/bin/bash

# Quick Environment Check Script
# Verifies all required configuration for AWS Transcribe

echo "🔍 AWS Transcribe Environment Check"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Create a .env file with required variables"
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"
echo ""

# Load .env
export $(cat .env | grep -v '^#' | xargs)

# Check MongoDB
echo "📊 MongoDB Configuration:"
if [ -z "$MONGODB_URI" ]; then
    echo -e "${RED}  ❌ MONGODB_URI not set${NC}"
else
    echo -e "${GREEN}  ✅ MONGODB_URI configured${NC}"
fi
echo ""

# Check JWT
echo "🔐 JWT Configuration:"
if [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}  ❌ JWT_SECRET not set${NC}"
else
    echo -e "${GREEN}  ✅ JWT_SECRET configured${NC}"
fi
echo ""

# Check AWS
echo "☁️  AWS Configuration:"
if [ -z "$AWS_REGION" ]; then
    echo -e "${RED}  ❌ AWS_REGION not set${NC}"
else
    echo -e "${GREEN}  ✅ AWS_REGION: $AWS_REGION${NC}"
fi

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo -e "${RED}  ❌ AWS_ACCESS_KEY_ID not set${NC}"
else
    echo -e "${GREEN}  ✅ AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:0:8}...${NC}"
fi

if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo -e "${RED}  ❌ AWS_SECRET_ACCESS_KEY not set${NC}"
else
    echo -e "${GREEN}  ✅ AWS_SECRET_ACCESS_KEY: ********${NC}"
fi

if [ -z "$S3_BUCKET" ]; then
    echo -e "${RED}  ❌ S3_BUCKET not set${NC}"
else
    echo -e "${GREEN}  ✅ S3_BUCKET: $S3_BUCKET${NC}"
fi
echo ""

# Check Node modules
echo "📦 Dependencies:"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}  ✅ node_modules installed${NC}"
    
    # Check critical packages
    if [ -d "node_modules/@aws-sdk/client-s3" ]; then
        echo -e "${GREEN}  ✅ AWS S3 SDK installed${NC}"
    else
        echo -e "${RED}  ❌ AWS S3 SDK not installed${NC}"
    fi
    
    if [ -d "node_modules/@aws-sdk/client-transcribe" ]; then
        echo -e "${GREEN}  ✅ AWS Transcribe SDK installed${NC}"
    else
        echo -e "${RED}  ❌ AWS Transcribe SDK not installed${NC}"
    fi
else
    echo -e "${RED}  ❌ node_modules not found${NC}"
    echo -e "${YELLOW}  Run: npm install${NC}"
fi
echo ""

# Check if server is running
echo "🚀 Server Status:"
if lsof -Pi :${PORT:-5000} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}  ✅ Server is running on port ${PORT:-5000}${NC}"
else
    echo -e "${YELLOW}  ⚠️  Server is not running${NC}"
    echo -e "${YELLOW}  Start with: npm run dev${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

MISSING=0

[ -z "$MONGODB_URI" ] && MISSING=$((MISSING + 1))
[ -z "$JWT_SECRET" ] && MISSING=$((MISSING + 1))
[ -z "$AWS_REGION" ] && MISSING=$((MISSING + 1))
[ -z "$AWS_ACCESS_KEY_ID" ] && MISSING=$((MISSING + 1))
[ -z "$AWS_SECRET_ACCESS_KEY" ] && MISSING=$((MISSING + 1))
[ -z "$S3_BUCKET" ] && MISSING=$((MISSING + 1))

if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}✅ All environment variables configured!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Ensure MongoDB is running"
    echo "2. Start server: npm run dev"
    echo "3. Test transcription: ./test_transcription.sh /path/to/audio.mp3"
else
    echo -e "${RED}❌ $MISSING environment variable(s) missing${NC}"
    echo ""
    echo "Please update your .env file with the missing variables."
    echo "See AWS_TRANSCRIBE_TESTING_GUIDE.md for details."
fi
echo ""
