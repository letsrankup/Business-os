-- File: database/schema-additions.sql
-- Run this in Supabase SQL Editor
-- Adds tables for: rate limiting, content, competitor, CRM, invoices, proposals, chat, activity logs

-- ─── User Profiles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company TEXT,
  website TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON user_profiles
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ─── AI Usage (Rate Limiting) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature TEXT NOT NULL, -- seo_audit | content_ai | proposal | competitor_ai | ai_chat | leads_ai | invoice_ai
  daily_count INT DEFAULT 0,
  monthly_count INT DEFAULT 0,
  last_day TEXT,   -- YYYY-MM-DD
  last_month TEXT, -- YYYY-MM
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature)
);
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own usage" ON ai_usage
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Activity Logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own logs" ON activity_logs
  USING (auth.uid() = user_id);
CREATE INDEX idx_activity_logs_user_date ON activity_logs(user_id, created_at DESC);

-- ─── SEO Audits ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seo_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  domain TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  score INT,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own audits" ON seo_audits
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Leads ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  website TEXT,
  source TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own leads" ON leads
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Generated Content ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- blog_article | linkedin_post | email_campaign | ad_copy | product_desc | social_media
  topic TEXT NOT NULL,
  tone TEXT DEFAULT 'Professional',
  keywords TEXT,
  target_audience TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own content" ON generated_content
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Proposals ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  client_business TEXT,
  your_name TEXT,
  your_company TEXT,
  budget TEXT,
  project_type TEXT DEFAULT 'Web Development',
  timeline TEXT DEFAULT '4 weeks',
  project_description TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own proposals" ON proposals
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Clients (CRM) ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  website TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own clients" ON clients
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Invoices ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  items JSONB NOT NULL DEFAULT '[]', -- [{description, quantity, rate, amount}]
  total NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  due_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own invoices" ON invoices
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Chat Messages ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  mode TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own chats" ON chat_messages
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(user_id, session_id, created_at);

-- ─── Competitor Analyses ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competitor_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  your_domain TEXT NOT NULL,
  competitor_domain TEXT NOT NULL,
  industry TEXT,
  analysis_type TEXT DEFAULT 'full',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE competitor_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own analyses" ON competitor_analyses
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
