# Email Settings Deployment Guide

This guide will help you deploy the updated backend with user-specific email settings functionality.

## Overview

The updated system allows each user to configure their own email settings instead of using hardcoded values. This includes:

- SMTP host and port configuration
- Email credentials (username/password)
- Display name customization
- Settings validation and testing
- Secure storage in Supabase

## Prerequisites

1. **Google Cloud Project** with Cloud Functions enabled
2. **Supabase Project** with authentication set up
3. **gcloud CLI** installed and authenticated
4. **Environment Variables** configured

## Step 1: Create Email Settings Table in Supabase

First, you need to create the `email_settings` table in your Supabase database.

### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL:

```sql
CREATE TABLE IF NOT EXISTS email_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_host VARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',
    email_port INTEGER NOT NULL DEFAULT 587,
    email_user VARCHAR(255) NOT NULL,
    email_password TEXT NOT NULL,
    email_display_name VARCHAR(255) DEFAULT 'Bulk Email Sender',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_settings_user_id ON email_settings(user_id);

-- Enable Row Level Security
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own settings
CREATE POLICY "Users can view own email settings" ON email_settings
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own settings
CREATE POLICY "Users can insert own email settings" ON email_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own settings
CREATE POLICY "Users can update own email settings" ON email_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own settings
CREATE POLICY "Users can delete own email settings" ON email_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_email_settings_updated_at 
    BEFORE UPDATE ON email_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### Option B: Using the Python Script

Run the provided script:

```bash
cd backend
python create_email_settings_table.py
```

## Step 2: Deploy Updated Backend

### Option A: Using Deployment Scripts

#### For Linux/macOS:
```bash
cd backend
chmod +x deploy_settings_update.sh
./deploy_settings_update.sh
```

#### For Windows:
```powershell
cd backend
.\deploy_settings_update.ps1
```

### Option B: Manual Deployment

1. **Set Environment Variables:**
   ```bash
   export SUPABASE_URL="your-supabase-url"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. **Deploy to Google Cloud Functions:**
   ```bash
   gcloud functions deploy email-api \
       --gen2 \
       --runtime=python311 \
       --region=us-central1 \
       --source=. \
       --entry-point=email_api \
       --trigger-http \
       --allow-unauthenticated \
       --memory=512MB \
       --timeout=540s \
       --set-env-vars="SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY" \
       --max-instances=10
   ```

## Step 3: Update Frontend Environment Variables

Update your frontend environment variables to point to the new backend:

```env
# .env.local
NEXT_PUBLIC_API_URL=https://your-function-url
```

## Step 4: Test the Implementation

### Backend Testing

1. **Test Authentication:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-function-url/api/test-auth
   ```

2. **Test Email Settings Endpoints:**
   ```bash
   # Get settings
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-function-url/api/email-settings
   
   # Save settings
   curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"email_host":"smtp.gmail.com","email_port":587,"email_user":"test@example.com","email_password":"password","email_display_name":"Test User"}' \
        https://your-function-url/api/email-settings
   
   # Test settings
   curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"email_host":"smtp.gmail.com","email_port":587,"email_user":"test@example.com","email_password":"password","email_display_name":"Test User"}' \
        https://your-function-url/api/email-settings/test
   ```

### Frontend Testing

1. **Access Settings Page:**
   - Navigate to `/settings` in your frontend
   - Configure email settings
   - Test the connection

2. **Verify Dashboard Warning:**
   - Check that the dashboard shows a warning when email settings are not configured
   - Verify the warning disappears after configuring settings

## New API Endpoints

The updated backend includes these new endpoints:

### GET /api/email-settings
- **Purpose:** Retrieve user's email settings
- **Authentication:** Required
- **Response:** Email settings object (password excluded)

### POST /api/email-settings
- **Purpose:** Save or update user's email settings
- **Authentication:** Required
- **Body:** Email settings object
- **Response:** Saved settings object (password excluded)

### POST /api/email-settings/test
- **Purpose:** Test email settings by sending a test email
- **Authentication:** Required
- **Body:** Email settings object
- **Response:** Success/failure message

## Security Features

1. **Row Level Security (RLS):** Users can only access their own settings
2. **Password Encryption:** Passwords are stored securely in Supabase
3. **Authentication Required:** All endpoints require valid authentication
4. **Input Validation:** All inputs are validated before processing

## Gmail App Password Setup

For Gmail users, you'll need to create an App Password:

1. Go to your Google Account settings
2. Navigate to **Security** > **2-Step Verification**
3. Scroll down to **App passwords**
4. Generate a new app password for "Mail"
5. Use this password instead of your regular Gmail password

## Troubleshooting

### Common Issues

1. **"No email settings found"**
   - User hasn't configured email settings yet
   - Navigate to `/settings` to configure

2. **"Email settings test failed"**
   - Check SMTP credentials
   - Verify App Password for Gmail
   - Check firewall/network settings

3. **"Authentication failed"**
   - Verify Supabase authentication is working
   - Check token expiration

4. **"Database connection error"**
   - Verify Supabase URL and service role key
   - Check network connectivity

### Debugging

1. **Check Cloud Function Logs:**
   ```bash
   gcloud functions logs read email-api --region=us-central1
   ```

2. **Test Database Connection:**
   ```bash
   python test_database.py
   ```

3. **Verify Environment Variables:**
   ```bash
   gcloud functions describe email-api --region=us-central1
   ```

## Migration from Hardcoded Settings

If you're migrating from the old hardcoded email settings:

1. **Backup Current Settings:** Note down current email configuration
2. **Deploy New Backend:** Follow deployment steps above
3. **Configure User Settings:** Each user needs to set up their own settings
4. **Test Thoroughly:** Verify all functionality works with new settings

## Cost Considerations

- **Supabase:** Minimal cost for email_settings table
- **Google Cloud Functions:** Pay per use, typically very low cost
- **Email Sending:** Depends on your email provider (Gmail is free)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Cloud Function logs
3. Verify Supabase table structure
4. Test with a simple email configuration first

## Next Steps

After successful deployment:

1. **User Onboarding:** Guide users to configure their email settings
2. **Documentation:** Update user documentation
3. **Monitoring:** Set up monitoring for email sending success rates
4. **Backup:** Consider backing up email settings data 