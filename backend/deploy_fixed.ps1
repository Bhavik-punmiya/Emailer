# Deploy fixed Google Cloud Function
# This script redeploys the main_gcf.py with the fixes for the startup issues

param(
    [string]$ProjectId = "national-space-hackathon"
)

Write-Host "🚀 Deploying fixed Google Cloud Function..." -ForegroundColor Green

# Configuration
$FunctionName = "email-api"
$Region = "us-central1"
$Runtime = "python311"
$EntryPoint = "email_api"
$Memory = "512MB"
$Timeout = "540s"

# Check if gcloud is installed
try {
    $null = Get-Command gcloud -ErrorAction Stop
} catch {
    Write-Host "❌ gcloud CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if user is authenticated
$authStatus = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if (-not $authStatus) {
    Write-Host "❌ Not authenticated with gcloud. Please run 'gcloud auth login' first." -ForegroundColor Red
    exit 1
}

# Set the project
Write-Host "📋 Setting project to $ProjectId..." -ForegroundColor Yellow
gcloud config set project $ProjectId

# Deploy the function
Write-Host "🚀 Deploying function to Google Cloud Functions..." -ForegroundColor Yellow

$deployCommand = @(
    "functions", "deploy", $FunctionName,
    "--gen2",
    "--runtime=$Runtime",
    "--region=$Region",
    "--source=.",
    "--entry-point=$EntryPoint",
    "--trigger-http",
    "--allow-unauthenticated",
    "--memory=$Memory",
    "--timeout=$Timeout",
    "--set-env-vars=SUPABASE_URL=$env:SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$env:SUPABASE_SERVICE_ROLE_KEY",
    "--max-instances=10"
)

$result = gcloud $deployCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Function deployed successfully!" -ForegroundColor Green
    
    # Get the function URL
    $FunctionUrl = gcloud functions describe $FunctionName --gen2 --region=$Region --format="value(serviceConfig.uri)"
    Write-Host "🌐 Function URL: $FunctionUrl" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host "The function should now start properly and listen on port 8080." -ForegroundColor Yellow
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
    exit 1
} 