#!/bin/bash

# Google Cloud Functions Deployment Script
# Make sure to set your environment variables before running this script

set -e

echo "🚀 Starting Google Cloud Functions Deployment..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with Google Cloud. Please run: gcloud auth login"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project ID set. Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Project ID: $PROJECT_ID"

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Function name
FUNCTION_NAME="email-api"

# Check if function exists
if gcloud functions describe $FUNCTION_NAME --region=us-central1 &>/dev/null; then
    echo "📝 Updating existing function: $FUNCTION_NAME"
else
    echo "🆕 Creating new function: $FUNCTION_NAME"
fi

# Deploy the function
echo "🚀 Deploying function..."
gcloud functions deploy $FUNCTION_NAME \
    --runtime python311 \
    --trigger-http \
    --allow-unauthenticated \
    --source . \
    --entry-point email_api \
    --memory 512MB \
    --timeout 540s \
    --max-instances 10 \
    --region us-central1

# Get the function URL
FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME --region=us-central1 --format="value(httpsTrigger.url)")

echo "✅ Deployment completed successfully!"
echo "🌐 Function URL: $FUNCTION_URL"
echo ""
echo "📝 Next steps:"
echo "1. Set your environment variables in Google Cloud Console or using gcloud"
echo "2. Update your frontend's NEXT_PUBLIC_API_URL to: $FUNCTION_URL"
echo "3. Test your function"
echo ""
echo "🔧 To set environment variables, run:"
echo "gcloud functions deploy $FUNCTION_NAME --update-env-vars SUPABASE_URL=your_url,SUPABASE_SERVICE_ROLE_KEY=your_key,EMAIL_USER=your_email,EMAIL_PASSWORD=your_password" 