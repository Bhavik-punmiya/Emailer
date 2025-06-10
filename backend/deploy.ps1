# Google Cloud Functions Deployment Script for Windows
# Make sure to set your environment variables before running this script

param(
    [string]$ProjectId = "",
    [string]$Region = "us-central1"
)

Write-Host "🚀 Starting Google Cloud Functions Deployment..." -ForegroundColor Green

# Check if gcloud is installed
try {
    $gcloudVersion = gcloud version --format="value(basic.version)" 2>$null
    if (-not $gcloudVersion) {
        Write-Host "❌ Google Cloud CLI is not installed. Please install it first." -ForegroundColor Red
        Write-Host "Visit: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Google Cloud CLI version: $gcloudVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Google Cloud CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Visit: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if user is authenticated
try {
    $authStatus = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
    if (-not $authStatus) {
        Write-Host "❌ Not authenticated with Google Cloud. Please run: gcloud auth login" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Authenticated as: $authStatus" -ForegroundColor Green
} catch {
    Write-Host "❌ Not authenticated with Google Cloud. Please run: gcloud auth login" -ForegroundColor Red
    exit 1
}

# Get or set project ID
if (-not $ProjectId) {
    $ProjectId = gcloud config get-value project 2>$null
    if (-not $ProjectId) {
        Write-Host "❌ No project ID set. Please provide one with -ProjectId parameter or run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Red
        exit 1
    }
} else {
    gcloud config set project $ProjectId
}

Write-Host "📋 Project ID: $ProjectId" -ForegroundColor Cyan

# Enable required APIs
Write-Host "🔧 Enabling required APIs..." -ForegroundColor Yellow
try {
    gcloud services enable cloudfunctions.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    Write-Host "✅ APIs enabled successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to enable APIs" -ForegroundColor Red
    exit 1
}

# Function name
$FunctionName = "email-api"

# Check if function exists
Write-Host "🔍 Checking if function exists..." -ForegroundColor Yellow
try {
    $existingFunction = gcloud functions describe $FunctionName --region=$Region 2>$null
    if ($existingFunction) {
        Write-Host "📝 Updating existing function: $FunctionName" -ForegroundColor Yellow
    }
} catch {
    Write-Host "🆕 Creating new function: $FunctionName" -ForegroundColor Yellow
}

# Deploy the function
Write-Host "🚀 Deploying function..." -ForegroundColor Green
try {
    gcloud functions deploy $FunctionName `
        --runtime python311 `
        --trigger-http `
        --allow-unauthenticated `
        --source . `
        --entry-point email_api `
        --memory 512MB `
        --timeout 540s `
        --max-instances 10 `
        --region $Region

    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

# Get the function URL
try {
    $FunctionUrl = gcloud functions describe $FunctionName --region=$Region --format="value(httpsTrigger.url)"
    Write-Host "🌐 Function URL: $FunctionUrl" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️  Could not retrieve function URL. Please check Google Cloud Console." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Set your environment variables in Google Cloud Console or using gcloud" -ForegroundColor White
Write-Host "2. Update your frontend's NEXT_PUBLIC_API_URL to: $FunctionUrl" -ForegroundColor White
Write-Host "3. Test your function" -ForegroundColor White
Write-Host ""
Write-Host "🔧 To set environment variables, run:" -ForegroundColor Yellow
Write-Host "gcloud functions deploy $FunctionName --update-env-vars SUPABASE_URL=your_url,SUPABASE_SERVICE_ROLE_KEY=your_key,EMAIL_USER=your_email,EMAIL_PASSWORD=your_password" -ForegroundColor White 