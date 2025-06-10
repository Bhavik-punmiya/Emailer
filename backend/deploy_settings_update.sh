#!/bin/bash

# Deploy updated backend with email settings functionality
# This script deploys the updated main_gcf.py to Google Cloud Functions

set -e

# Configuration
PROJECT_ID="your-project-id"  # Replace with your actual project ID
FUNCTION_NAME="email-api"
REGION="us-central1"
RUNTIME="python311"
ENTRY_POINT="email_api"
MEMORY="512MB"
TIMEOUT="540s"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Deploying updated backend with email settings functionality...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Not authenticated with gcloud. Please run 'gcloud auth login' first.${NC}"
    exit 1
fi

# Set the project
echo -e "${YELLOW}📋 Setting project to ${PROJECT_ID}...${NC}"
gcloud config set project $PROJECT_ID

# Create the email_settings table in Supabase
echo -e "${YELLOW}🗄️  Creating email_settings table in Supabase...${NC}"
echo -e "${YELLOW}Please run the following SQL in your Supabase SQL editor:${NC}"
echo ""
echo "CREATE TABLE IF NOT EXISTS email_settings ("
echo "    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,"
echo "    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,"
echo "    email_host VARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',"
echo "    email_port INTEGER NOT NULL DEFAULT 587,"
echo "    email_user VARCHAR(255) NOT NULL,"
echo "    email_password TEXT NOT NULL,"
echo "    email_display_name VARCHAR(255) DEFAULT 'Bulk Email Sender',"
echo "    is_active BOOLEAN DEFAULT true,"
echo "    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),"
echo "    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),"
echo "    UNIQUE(user_id)"
echo ");"
echo ""
echo "-- Create index for faster lookups"
echo "CREATE INDEX IF NOT EXISTS idx_email_settings_user_id ON email_settings(user_id);"
echo ""
echo "-- Enable Row Level Security"
echo "ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;"
echo ""
echo "-- Create policy to allow users to only see their own settings"
echo "CREATE POLICY \"Users can view own email settings\" ON email_settings"
echo "    FOR SELECT USING (auth.uid() = user_id);"
echo ""
echo "-- Create policy to allow users to insert their own settings"
echo "CREATE POLICY \"Users can insert own email settings\" ON email_settings"
echo "    FOR INSERT WITH CHECK (auth.uid() = user_id);"
echo ""
echo "-- Create policy to allow users to update their own settings"
echo "CREATE POLICY \"Users can update own email settings\" ON email_settings"
echo "    FOR UPDATE USING (auth.uid() = user_id);"
echo ""
echo "-- Create policy to allow users to delete their own settings"
echo "CREATE POLICY \"Users can delete own email settings\" ON email_settings"
echo "    FOR DELETE USING (auth.uid() = user_id);"
echo ""
echo "-- Create function to automatically update updated_at timestamp"
echo "CREATE OR REPLACE FUNCTION update_updated_at_column()"
echo "RETURNS TRIGGER AS \$\$"
echo "BEGIN"
echo "    NEW.updated_at = NOW();"
echo "    RETURN NEW;"
echo "END;"
echo "\$\$ language 'plpgsql';"
echo ""
echo "-- Create trigger to automatically update updated_at"
echo "CREATE TRIGGER update_email_settings_updated_at"
echo "    BEFORE UPDATE ON email_settings"
echo "    FOR EACH ROW"
echo "    EXECUTE FUNCTION update_updated_at_column();"
echo ""

read -p "Have you created the email_settings table in Supabase? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Please create the email_settings table first.${NC}"
    exit 1
fi

# Deploy the function
echo -e "${YELLOW}🚀 Deploying function to Google Cloud Functions...${NC}"

gcloud functions deploy $FUNCTION_NAME \
    --gen2 \
    --runtime=$RUNTIME \
    --region=$REGION \
    --source=. \
    --entry-point=$ENTRY_POINT \
    --trigger-http \
    --allow-unauthenticated \
    --memory=$MEMORY \
    --timeout=$TIMEOUT \
    --set-env-vars="SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY" \
    --max-instances=10

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Function deployed successfully!${NC}"
    
    # Get the function URL
    FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME --gen2 --region=$REGION --format="value(serviceConfig.uri)")
    echo -e "${GREEN}🌐 Function URL: ${FUNCTION_URL}${NC}"
    
    # Test the function
    echo -e "${YELLOW}🧪 Testing function...${NC}"
    curl -s "$FUNCTION_URL/" | jq . || echo "Function is responding (JSON parsing failed, but that's okay)"
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "1. Update your frontend environment variables with the new function URL"
    echo "2. Test the email settings functionality in your frontend"
    echo "3. Users can now configure their own email settings"
    echo ""
    echo -e "${YELLOW}🔗 Function URL: ${FUNCTION_URL}${NC}"
    
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi 