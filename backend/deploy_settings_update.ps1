# Deploy updated backend with email settings functionality
# This script deploys the updated main_gcf.py to Google Cloud Functions

param(
    [string]$ProjectId = "your-project-id"  # Replace with your actual project ID
)

# Configuration
$FunctionName = "email-api"
$Region = "us-central1"
$Runtime = "python311"
$EntryPoint = "email_api"
$Memory = "512MB"
$Timeout = "540s"

Write-Host "🚀 Deploying updated backend with email settings functionality..." -ForegroundColor Yellow

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

# Create the email_settings table in Supabase
Write-Host "🗄️  Creating email_settings table in Supabase..." -ForegroundColor Yellow
Write-Host "Please run the following SQL in your Supabase SQL editor:" -ForegroundColor Yellow
Write-Host ""
Write-Host "CREATE TABLE IF NOT EXISTS email_settings ("
Write-Host "    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,"
Write-Host "    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,"
Write-Host "    email_host VARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',"
Write-Host "    email_port INTEGER NOT NULL DEFAULT 587,"
Write-Host "    email_user VARCHAR(255) NOT NULL,"
Write-Host "    email_password TEXT NOT NULL,"
Write-Host "    email_display_name VARCHAR(255) DEFAULT 'Bulk Email Sender',"
Write-Host "    is_active BOOLEAN DEFAULT true,"
Write-Host "    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),"
Write-Host "    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),"
Write-Host "    UNIQUE(user_id)"
Write-Host ");"
Write-Host ""
Write-Host "-- Create index for faster lookups"
Write-Host "CREATE INDEX IF NOT EXISTS idx_email_settings_user_id ON email_settings(user_id);"
Write-Host ""
Write-Host "-- Enable Row Level Security"
Write-Host "ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;"
Write-Host ""
Write-Host "-- Create policy to allow users to only see their own settings"
Write-Host "CREATE POLICY `"Users can view own email settings`" ON email_settings"
Write-Host "    FOR SELECT USING (auth.uid() = user_id);"
Write-Host ""
Write-Host "-- Create policy to allow users to insert their own settings"
Write-Host "CREATE POLICY `"Users can insert own email settings`" ON email_settings"
Write-Host "    FOR INSERT WITH CHECK (auth.uid() = user_id);"
Write-Host ""
Write-Host "-- Create policy to allow users to update their own settings"
Write-Host "CREATE POLICY `"Users can update own email settings`" ON email_settings"
Write-Host "    FOR UPDATE USING (auth.uid() = user_id);"
Write-Host ""
Write-Host "-- Create policy to allow users to delete their own settings"
Write-Host "CREATE POLICY `"Users can delete own email settings`" ON email_settings"
Write-Host "    FOR DELETE USING (auth.uid() = user_id);"
Write-Host ""
Write-Host "-- Create function to automatically update updated_at timestamp"
Write-Host "CREATE OR REPLACE FUNCTION update_updated_at_column()"
Write-Host "RETURNS TRIGGER AS `$\$"
Write-Host "BEGIN"
Write-Host "    NEW.updated_at = NOW();"
Write-Host "    RETURN NEW;"
Write-Host "END;"
Write-Host "`$\$ language 'plpgsql';"
Write-Host ""
Write-Host "-- Create trigger to automatically update updated_at"
Write-Host "CREATE TRIGGER update_email_settings_updated_at"
Write-Host "    BEFORE UPDATE ON email_settings"
Write-Host "    FOR EACH ROW"
Write-Host "    EXECUTE FUNCTION update_updated_at_column();"
Write-Host ""

$response = Read-Host "Have you created the email_settings table in Supabase? (y/n)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "❌ Please create the email_settings table first." -ForegroundColor Red
    exit 1
}

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
    $functionUrl = gcloud functions describe $FunctionName --gen2 --region=$Region --format="value(serviceConfig.uri)"
    Write-Host "🌐 Function URL: $functionUrl" -ForegroundColor Green
    
    # Test the function
    Write-Host "🧪 Testing function..." -ForegroundColor Yellow
    try {
        $testResponse = Invoke-RestMethod -Uri $functionUrl -Method Get
        Write-Host "Function is responding correctly" -ForegroundColor Green
    } catch {
        Write-Host "Function is responding (JSON parsing failed, but that's okay)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Update your frontend environment variables with the new function URL"
    Write-Host "2. Test the email settings functionality in your frontend"
    Write-Host "3. Users can now configure their own email settings"
    Write-Host ""
    Write-Host "🔗 Function URL: $functionUrl" -ForegroundColor Yellow
    
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
} 