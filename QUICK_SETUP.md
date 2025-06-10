# Quick Setup Guide

Get your bulk email sender running in 5 minutes!

## Prerequisites
- Python 3.8+
- Node.js 18+
- Supabase account (free)

## 1. Supabase Setup (2 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings → API and copy:
   - Project URL
   - Anon public key
   - Service role key (keep this secret!)

## 2. Database Setup (1 minute)

Run these SQL commands in your Supabase SQL editor:

```sql
-- Contacts table
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  job_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates table
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email campaigns table
CREATE TABLE email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  total_recipients INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign stats table
CREATE TABLE campaign_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  total_recipients INTEGER NOT NULL,
  successful_sends INTEGER DEFAULT 0,
  failed_sends INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT,
  job_id TEXT,
  job_title TEXT,
  job_link TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 3. Environment Setup (1 minute)

### Backend
```bash
cd backend
cp env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_DISPLAY_NAME=Your Company
SECRET_KEY=any_random_string
```

### Frontend
```bash
cd bulk-referral-sender
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 4. Start the Application (1 minute)

### Option A: Use the startup script
```bash
# On Windows:
start-dev.bat

# On macOS/Linux:
chmod +x start-dev.sh
./start-dev.sh
```

### Option B: Manual start
```bash
# Terminal 1 - Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
python main.py

# Terminal 2 - Frontend
cd bulk-referral-sender
npm install
npm run dev
```

## 5. Test the Application

1. Open http://localhost:3000
2. Sign up for an account
3. Upload the sample CSV: `sample-contacts.csv`
4. Create an email template
5. Send a test email!

## Email Provider Setup

### Gmail (Recommended)
1. Enable 2-factor authentication
2. Go to Security → App passwords
3. Generate a new app password
4. Use this password in your `.env` file

### Outlook
1. Use your email and password
2. Set `EMAIL_HOST=smtp-mail.outlook.com`

## Troubleshooting

- **"Module not found"**: Run `pip install -r requirements.txt` in backend
- **"Cannot connect to API"**: Make sure backend is running on port 8000
- **"Authentication failed"**: Check your Supabase credentials
- **"Email sending failed"**: Verify your email provider settings

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check out the API docs at http://localhost:8000/docs
- Customize the email templates and styling
- Set up production deployment

Happy emailing! 🚀 