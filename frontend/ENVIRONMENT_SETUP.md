# Frontend Environment Setup

## 🚀 Integration with Deployed Backend

Your backend is now deployed at:
**https://us-central1-national-space-hackathon.cloudfunctions.net/email-api**

## 📋 Environment Variables Setup

### 1. Local Development

Create a `.env.local` file in your frontend directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://us-central1-national-space-hackathon.cloudfunctions.net/email-api

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://pakvghnorcugqqgmmqqv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBha3ZnaG5vcmN1Z3FxZ21tcXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0ODc0MDQsImV4cCI6MjA2NTA2MzQwNH0.3linTAY-T39HNMbtNuU6nJmXSVq4ZVFSP4LrjlJ0OLA
```

### 2. Production Deployment

#### For Vercel:
1. Go to your project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:
   - `NEXT_PUBLIC_API_URL` = `https://us-central1-national-space-hackathon.cloudfunctions.net/email-api`
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://pakvghnorcugqqgmmqqv.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBha3ZnaG5vcmN1Z3FxZ21tcXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0ODc0MDQsImV4cCI6MjA2NTA2MzQwNH0.3linTAY-T39HNMbtNuU6nJmXSVq4ZVFSP4LrjlJ0OLA`

#### For Netlify:
1. Go to Site settings → Environment variables
2. Add the same variables as above

#### For Other Platforms:
Set the environment variables according to your platform's documentation.

## 🔧 How It Works

Your frontend's `lib/api.ts` file is already configured to use the environment variable:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

This means:
- **Development**: Uses `http://localhost:8000` (fallback)
- **Production**: Uses the Google Cloud Functions URL

## 🧪 Testing the Integration

1. **Local Testing**: Run `node test-integration.js` to test the connection
2. **Frontend Testing**: Start your frontend and test the email functionality
3. **Production Testing**: Deploy and test in production environment

## 📊 Benefits Achieved

✅ **Serverless Backend**: No server maintenance required  
✅ **Auto-scaling**: Handles traffic spikes automatically  
✅ **Cost-effective**: Pay only for usage  
✅ **Global CDN**: Fast response times worldwide  
✅ **Reliable**: Google's infrastructure  

## 🔍 Troubleshooting

### Common Issues:

1. **CORS Errors**: The backend is configured to allow all origins
2. **Authentication Errors**: Make sure Supabase tokens are valid
3. **Network Errors**: Check if the Google Cloud Function URL is accessible

### Debug Commands:

```bash
# Test backend directly
curl https://us-central1-national-space-hackathon.cloudfunctions.net/email-api/

# Test from frontend
node test-integration.js
```

## 🎯 Next Steps

1. Set up environment variables in your deployment platform
2. Deploy your frontend
3. Test all email functionality
4. Monitor usage in Google Cloud Console 