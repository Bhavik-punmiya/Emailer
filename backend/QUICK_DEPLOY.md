# Quick Deployment Guide

## 🚀 Fast Deployment Steps

### 1. Install Google Cloud CLI
```bash
# Windows (PowerShell)
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe

# macOS/Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 2. Setup Google Cloud
```bash
# Login
gcloud auth login

# Set project (replace with your project ID)
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 3. Deploy (Choose One)

**Option A: Using PowerShell (Windows)**
```powershell
.\deploy.ps1 -ProjectId YOUR_PROJECT_ID
```

**Option B: Using Bash (macOS/Linux)**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Option C: Manual Deployment**
```bash
gcloud functions deploy email-api \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --source . \
  --entry-point email_api \
  --memory 512MB \
  --timeout 540s \
  --max-instances 10 \
  --region us-central1
```

### 4. Set Environment Variables
```bash
gcloud functions deploy email-api --update-env-vars \
  SUPABASE_URL=your_supabase_url,\
  SUPABASE_SERVICE_ROLE_KEY=your_supabase_key,\
  EMAIL_HOST=smtp.gmail.com,\
  EMAIL_PORT=587,\
  EMAIL_USER=your_email@gmail.com,\
  EMAIL_PASSWORD=your_app_password,\
  EMAIL_DISPLAY_NAME=Your Display Name
```

### 5. Test Deployment
```bash
python test_gcf.py
```

### 6. Update Frontend
Set in your frontend environment:
```
NEXT_PUBLIC_API_URL=https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/email-api
```

## 📋 Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIs...` |
| `EMAIL_HOST` | SMTP server | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | Your email address | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | Email app password | `your-app-password` |
| `EMAIL_DISPLAY_NAME` | Email sender name | `Your Company Name` |

## 💰 Cost Optimization

- **Free Tier**: 2M invocations/month, 400K GB-seconds
- **Max Instances**: Set to 10 to prevent excessive costs
- **Memory**: 512MB is sufficient for most use cases
- **Timeout**: 540s (9 minutes) maximum for free tier

## 🔧 Troubleshooting

### Common Issues:
1. **Authentication Error**: Run `gcloud auth login`
2. **Project Not Set**: Run `gcloud config set project YOUR_PROJECT_ID`
3. **API Not Enabled**: Run the enable commands above
4. **Deployment Fails**: Check logs with `gcloud functions logs read email-api`

### Useful Commands:
```bash
# View function details
gcloud functions describe email-api --region=us-central1

# View logs
gcloud functions logs read email-api --region=us-central1

# Delete function
gcloud functions delete email-api --region=us-central1

# List functions
gcloud functions list --region=us-central1
```

## 📞 Support

If you encounter issues:
1. Check the detailed guide in `deploy_to_gcf.md`
2. Review Google Cloud Console logs
3. Ensure all environment variables are set correctly
4. Verify your Google Cloud billing is enabled 