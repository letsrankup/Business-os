-- database/schema-additions.sql
-- Run this in Supabase SQL Editor
-- Business OS - Schema Additions

-- ============================================================
-- LEADS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  website TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  source TEXT DEFAULT 'manual',
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  notes TEXT,
  ai_summary TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROPOSALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected')),
  content JSONB DEFAULT '{}',
  total_amount DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  valid_until DATE,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVOICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  line_items JSONB DEFAULT '[]',
  subtotal DECIMAL(12, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CRM CONTACTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  website TEXT,
  address JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CRM ACTIVITIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'task')),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEO AUDITS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS seo_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  issues JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTENT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS content_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'blog' CHECK (type IN ('blog', 'social', 'email', 'ad', 'other')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  ai_generated BOOLEAN DEFAULT FALSE,
  model_used TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHAT SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Chat',
  messages JSONB DEFAULT '[]',
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address JSONB DEFAULT '{}',
  logo_url TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_counter INTEGER DEFAULT 1,
  default_currency TEXT DEFAULT 'USD',
  default_tax_rate DECIMAL(5, 2) DEFAULT 0,
  ai_preferences JSONB DEFAULT '{}',
  notifications JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user_id ON crm_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_content_items_user_id ON content_items(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own data)
CREATE POLICY "leads_user_policy" ON leads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "proposals_user_policy" ON proposals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "invoices_user_policy" ON invoices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "crm_contacts_user_policy" ON crm_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "crm_activities_user_policy" ON crm_activities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "seo_audits_user_policy" ON seo_audits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "content_items_user_policy" ON content_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "chat_sessions_user_policy" ON chat_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_settings_policy" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- AUTO-UPDATE updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER crm_contacts_updated_at BEFORE UPDATE ON crm_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER content_items_updated_at BEFORE UPDATE ON content_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
