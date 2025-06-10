# Bulk Email Sender - End-to-End Application

A comprehensive bulk email sender application with a Next.js frontend and FastAPI backend, featuring user authentication, contact management, email templates, and real-time campaign tracking.

## Features

- **User Authentication**: Secure login/signup with Supabase Auth
- **Contact Management**: Upload and manage contacts via CSV
- **Email Templates**: Create, save, and reuse email templates
- **Bulk Email Sending**: Send personalized emails to multiple recipients
- **Real-time Progress Tracking**: Monitor email campaign progress
- **Campaign Analytics**: Track successful and failed sends
- **Advanced Settings**: Configure company details and contact information

## Tech Stack

### Frontend
- **Next.js 15** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components
- **Supabase** for authentication and database
- **React Hook Form** for form handling

### Backend
- **FastAPI** for API development
- **Python 3.8+** 
- **SMTP** for email sending
- **Supabase** for database operations
- **Background Tasks** for async email processing

## Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.8+
- Supabase account
- Email provider (Gmail, Outlook, etc.)

## Setup Instructions

### 1. Clone and Setup Project Structure

```bash
# Clone the repository
git clone <your-repo-url>
cd Emailer

# The project has two main directories:
# - bulk-referral-sender/ (Frontend)
# - backend/ (Backend)
```

### 2. Frontend Setup

```bash
cd bulk-referral-sender

# Install dependencies
npm install
# or
pnpm install

# Create environment file
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Backend Setup

```bash
cd ../backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp env.example .env
```

Edit `.env` with your configuration:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_DISPLAY_NAME=Your Company Name

# Security
SECRET_KEY=your_secret_key_here
```

### 4. Database Setup

Create the following tables in your Supabase database:

#### Users Table (Auto-created by Supabase Auth)
```sql
-- This is automatically created by Supabase Auth
```

#### Contacts Table
```sql
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  job_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Templates Table
```sql
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Email Campaigns Table
```sql
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
```

#### Campaign Stats Table
```sql
CREATE TABLE campaign_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  total_recipients INTEGER NOT NULL,
  successful_sends INTEGER DEFAULT 0,
  failed_sends INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### User Settings Table
```sql
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

### 5. Email Provider Setup

#### For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in your `.env` file

#### For Outlook/Office 365:
1. Use your email and password
2. Set `EMAIL_HOST=smtp-mail.outlook.com`

### 6. Running the Application

#### Start the Backend
```bash
cd backend
# Activate virtual environment if not already activated
python main.py
```

The backend will start on `http://localhost:8000`

#### Start the Frontend
```bash
cd bulk-referral-sender
npm run dev
# or
pnpm dev
```

The frontend will start on `http://localhost:3000`

### 7. API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

## Usage

1. **Sign Up/Login**: Create an account or login with existing credentials
2. **Upload Contacts**: Upload a CSV file with Name and Email columns
3. **Create Template**: Compose an email template with personalization variables
4. **Send Emails**: Review and send bulk emails to your contacts
5. **Monitor Progress**: Track the progress of your email campaigns

## CSV Format

Your CSV file should have the following columns:
```csv
name,email,company,job_title
John Doe,john@example.com,Acme Corp,Software Engineer
Jane Smith,jane@example.com,Tech Inc,Product Manager
```

## Personalization Variables

Use these variables in your email templates:
- `{name}` - Contact's name
- `{email}` - Contact's email
- `{company}` - Contact's company
- `{jobTitle}` - Contact's job title

## Troubleshooting

### Common Issues

1. **Email sending fails**: Check your email provider settings and app passwords
2. **Authentication errors**: Verify your Supabase credentials
3. **CORS errors**: Ensure the frontend URL is in the backend CORS settings
4. **Database errors**: Check that all tables are created correctly

### Logs

- Backend logs are displayed in the terminal
- Frontend errors are shown in the browser console
- Check Supabase logs for database-related issues

## Security Considerations

- Never commit `.env` files to version control
- Use environment variables for sensitive data
- Implement rate limiting for email sending
- Validate all user inputs
- Use HTTPS in production

## Production Deployment

### Frontend (Vercel/Netlify)
1. Set environment variables in your hosting platform
2. Build and deploy the Next.js application

### Backend (Railway/Render/Heroku)
1. Set environment variables in your hosting platform
2. Deploy the FastAPI application
3. Update the frontend API URL to point to your production backend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 