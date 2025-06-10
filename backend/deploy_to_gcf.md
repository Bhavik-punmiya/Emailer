# Deploy Backend to Google Cloud Functions

## Prerequisites

1. **Google Cloud Account**: You need a Google Cloud account with billing enabled
2. **Google Cloud CLI**: Install the Google Cloud CLI (gcloud)
3. **Project Setup**: Create or select a Google Cloud project

## Step-by-Step Deployment Guide

### 1. Install Google Cloud CLI

**Windows:**
```bash
# Download and install from: https://cloud.google.com/sdk/docs/install
# Or use PowerShell:
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

**macOS/Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 2. Initialize Google Cloud

```bash
# Login to your Google Cloud account
gcloud auth login

# Set your project ID (replace with your actual project ID)
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 3. Set Environment Variables

You need to set your environment variables in Google Cloud Functions. You can do this via the console or using gcloud:

```bash
# Set environment variables
gcloud functions deploy email-api \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL=your_supabase_url,SUPABASE_SERVICE_ROLE_KEY=your_supabase_key,EMAIL_HOST=smtp.gmail.com,EMAIL_PORT=587,EMAIL_USER=your_email@gmail.com,EMAIL_PASSWORD=your_app_password,EMAIL_DISPLAY_NAME=Your Display Name
```

### 4. Deploy the Function

Navigate to your backend directory and run:

```bash
# Deploy the function
gcloud functions deploy email-api \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --source . \
  --entry-point email_api \
  --memory 512MB \
  --timeout 540s \
  --max-instances 10
```

### 5. Get Your Function URL

After deployment, you'll get a URL like:
```
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/email-api
```

### 6. Update Frontend Environment Variables

In your frontend deployment, set:
```
NEXT_PUBLIC_API_URL=https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/email-api
```

## Configuration Options

### Memory and Timeout
- **Memory**: 512MB (default) - increase if needed
- **Timeout**: 540s (9 minutes) - maximum for free tier
- **Max Instances**: 10 (prevents excessive costs)

### Environment Variables
Make sure to set these in Google Cloud Functions:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `EMAIL_HOST`: SMTP server (e.g., smtp.gmail.com)
- `EMAIL_PORT`: SMTP port (usually 587)
- `EMAIL_USER`: Your email address
- `EMAIL_PASSWORD`: Your email app password
- `EMAIL_DISPLAY_NAME`: Display name for emails

## Cost Optimization

### Free Tier Limits
- 2 million invocations per month
- 400,000 GB-seconds of compute time
- 200,000 vCPU-seconds of compute time

### Cost Control
1. **Set max instances**: Limits concurrent executions
2. **Use appropriate memory**: Don't over-allocate
3. **Monitor usage**: Check Cloud Console regularly
4. **Set up billing alerts**: Get notified of high usage

## Monitoring and Logs

### View Logs
```bash
gcloud functions logs read email-api
```

### Monitor in Console
- Go to Google Cloud Console
- Navigate to Cloud Functions
- Select your function
- View logs, metrics, and performance

## Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase timeout or optimize code
2. **Memory Errors**: Increase memory allocation
3. **Authentication Errors**: Check environment variables
4. **CORS Issues**: Verify CORS headers in function

### Debug Commands
```bash
# Test function locally
functions-framework --target email_api --debug

# View function details
gcloud functions describe email-api

# Update function
gcloud functions deploy email-api --source .
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to code
2. **CORS**: Configure allowed origins properly
3. **Authentication**: Use proper JWT validation
4. **Rate Limiting**: Consider implementing rate limits

## Next Steps

1. Test your deployed function
2. Update frontend environment variables
3. Set up monitoring and alerts
4. Configure custom domain (optional)
5. Set up CI/CD for automated deployments 