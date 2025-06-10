-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Create contact lists table
CREATE TABLE IF NOT EXISTS contact_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contact_list_members junction table
CREATE TABLE IF NOT EXISTS contact_list_members (
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, list_id)
);

-- Create email_campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaign_stats table
CREATE TABLE IF NOT EXISTS campaign_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  successful_sends INTEGER NOT NULL DEFAULT 0,
  failed_sends INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  job_id TEXT,
  job_title TEXT,
  job_link TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Templates policies
CREATE POLICY templates_select ON templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY templates_insert ON templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY templates_update ON templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY templates_delete ON templates FOR DELETE USING (auth.uid() = user_id);

-- Contacts policies
CREATE POLICY contacts_select ON contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY contacts_insert ON contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY contacts_update ON contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY contacts_delete ON contacts FOR DELETE USING (auth.uid() = user_id);

-- Contact lists policies
CREATE POLICY contact_lists_select ON contact_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY contact_lists_insert ON contact_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY contact_lists_update ON contact_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY contact_lists_delete ON contact_lists FOR DELETE USING (auth.uid() = user_id);

-- Contact list members policies
CREATE POLICY contact_list_members_select ON contact_list_members 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contact_lists 
      WHERE contact_lists.id = contact_list_members.list_id 
      AND contact_lists.user_id = auth.uid()
    )
  );

-- Email campaigns policies
CREATE POLICY email_campaigns_select ON email_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY email_campaigns_insert ON email_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY email_campaigns_update ON email_campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY email_campaigns_delete ON email_campaigns FOR DELETE USING (auth.uid() = user_id);

-- Campaign stats policies
CREATE POLICY campaign_stats_select ON campaign_stats 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM email_campaigns 
      WHERE email_campaigns.id = campaign_stats.campaign_id 
      AND email_campaigns.user_id = auth.uid()
    )
  );

-- User settings policies
CREATE POLICY user_settings_select ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_settings_insert ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_settings_update ON user_settings FOR UPDATE USING (auth.uid() = user_id);
