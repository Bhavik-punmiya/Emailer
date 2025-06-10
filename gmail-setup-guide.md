# Gmail App Password Setup Guide

## 🔧 **Fix the Gmail Authentication Error**

The error `Application-specific password required` means Gmail needs an App Password instead of your regular password.

### **Step 1: Enable 2-Factor Authentication**

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** in the left sidebar
3. Under "Signing in to Google," click **2-Step Verification**
4. Follow the steps to turn on 2-Step Verification

### **Step 2: Generate App Password**

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Sign in with your Google Account
3. Under "Select app," choose **Mail**
4. Under "Select device," choose **Other (Custom name)**
5. Type a name like "Bulk Email Sender"
6. Click **Generate**
7. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)

### **Step 3: Update Your Backend Configuration**

1. Open your `backend/.env` file
2. Replace the `EMAIL_PASSWORD` line with your new App Password:

```env
EMAIL_PASSWORD=your_16_character_app_password_here
```

**Important:** 
- Remove the spaces from the App Password
- Don't use quotes around the password
- Make sure there are no extra spaces

### **Step 4: Restart Your Backend**

```bash
# Stop the current backend (Ctrl+C)
# Then restart:
python main.py
```

### **Step 5: Test Again**

Now try sending emails again from your frontend. It should work!

## 🔍 **Example .env Configuration**

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=Bhavikpunmiya@gmail.com
EMAIL_PASSWORD=abcd1234efgh5678ijkl9012mnop3456
EMAIL_DISPLAY_NAME="Bhavik Punmiya"
SECRET_KEY=your_secret_key_here
```

## 🚨 **Security Notes**

- **Never share your App Password**
- **App Passwords are more secure** than your regular password
- **You can revoke App Passwords** anytime from your Google Account
- **Each app gets its own password** - if one is compromised, others are safe

## 🎯 **After Setup**

Once you've updated the App Password and restarted the backend, your email sending should work perfectly! The system will be able to authenticate with Gmail and send emails to all your contacts. 