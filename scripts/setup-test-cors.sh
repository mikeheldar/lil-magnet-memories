#!/bin/bash
# Script to apply CORS configuration to test Firebase Storage bucket

echo "Setting up CORS for test Firebase Storage bucket..."
echo "Bucket: lil-magnet-memories-test.firebasestorage.app"
echo ""

# Set the test project
gcloud config set project lil-magnet-memories-test

# Apply CORS configuration
echo "Applying CORS configuration..."
gsutil cors set cors.json gs://lil-magnet-memories-test.firebasestorage.app

# Verify CORS is set
echo ""
echo "Verifying CORS configuration..."
gsutil cors get gs://lil-magnet-memories-test.firebasestorage.app

echo ""
echo "✅ CORS setup complete!"
echo "Wait 1-2 minutes for changes to propagate, then test uploads."

