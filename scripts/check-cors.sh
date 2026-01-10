#!/bin/bash

# CORS Check Script for Lil Magnet Memories
# This script checks CORS configuration for both production and test buckets

echo "🔍 Checking CORS Configuration for Firebase Storage Buckets"
echo "============================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Production bucket
PROD_BUCKET="lil-magnet-memories.firebasestorage.app"
echo "📦 Production Bucket: $PROD_BUCKET"
echo "-----------------------------------"

# Set production project
gcloud config set project lil-magnet-memories > /dev/null 2>&1

# Check if bucket exists
if gsutil ls -b gs://$PROD_BUCKET > /dev/null 2>&1; then
    echo "✅ Bucket exists"
    echo ""
    echo "Current CORS configuration:"
    gsutil cors get gs://$PROD_BUCKET 2>&1 | python3 -m json.tool 2>/dev/null || gsutil cors get gs://$PROD_BUCKET
else
    echo -e "${RED}❌ Bucket not found${NC}"
    echo "Trying alternative format: lil-magnet-memories.appspot.com"
    if gsutil ls -b gs://lil-magnet-memories.appspot.com > /dev/null 2>&1; then
        echo "✅ Found alternative bucket: lil-magnet-memories.appspot.com"
        echo ""
        echo "Current CORS configuration:"
        gsutil cors get gs://lil-magnet-memories.appspot.com 2>&1 | python3 -m json.tool 2>/dev/null || gsutil cors get gs://lil-magnet-memories.appspot.com
    fi
fi

echo ""
echo ""

# Test bucket - try multiple possible names
TEST_BUCKETS=(
    "lil-magnet-memories-test.firebasestorage.app"
    "lil-magnet-memories-test.appspot.com"
)

echo "📦 Test Bucket"
echo "-----------------------------------"

# Try to find test project
TEST_PROJECT=$(gcloud projects list --format="value(projectId)" 2>/dev/null | grep -i "test\|magnet" | grep -i test | head -1)

if [ -z "$TEST_PROJECT" ]; then
    echo -e "${YELLOW}⚠️  Test project not found in gcloud${NC}"
    echo "You may need to:"
    echo "  1. Create the test project in Firebase Console"
    echo "  2. Or manually check the bucket name in Vercel environment variables"
    echo ""
    echo "Trying to find test bucket anyway..."
else
    echo "Found test project: $TEST_PROJECT"
    gcloud config set project "$TEST_PROJECT" > /dev/null 2>&1
fi

FOUND_TEST_BUCKET=false
for TEST_BUCKET in "${TEST_BUCKETS[@]}"; do
    if gsutil ls -b gs://$TEST_BUCKET > /dev/null 2>&1; then
        echo "✅ Found test bucket: $TEST_BUCKET"
        echo ""
        echo "Current CORS configuration:"
        gsutil cors get gs://$TEST_BUCKET 2>&1 | python3 -m json.tool 2>/dev/null || gsutil cors get gs://$TEST_BUCKET
        FOUND_TEST_BUCKET=true
        break
    fi
done

if [ "$FOUND_TEST_BUCKET" = false ]; then
    echo -e "${YELLOW}⚠️  Test bucket not found${NC}"
    echo ""
    echo "To find your test bucket:"
    echo "  1. Check Vercel environment variables: VITE_FIREBASE_STORAGE_BUCKET_TEST"
    echo "  2. Or check Firebase Console: https://console.firebase.google.com/project/lil-magnet-memories-test/storage"
fi

echo ""
echo "============================================================"
echo "📝 To update CORS, run:"
echo "   gsutil cors set cors.json gs://[BUCKET_NAME]"
echo ""
echo "📖 See CORS_CHECK_GUIDE.md for detailed instructions"
echo "============================================================"

