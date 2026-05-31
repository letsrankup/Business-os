-- AI Business OS — Supabase Schema
-- Paste this in Supabase → SQL Editor → Run

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS audits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  url TEXT NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  content_type TEXT NOT NULL,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  company TEXT,
  role TEXT,
  email TEXT,
  website TEXT,
  industry TEXT,
  score INTEGER,
  description TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  status TEXT DEFAULT 'lead',
  stage TEXT DEFAULT 'discovery',
  contract_value DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  client_name TEXT NOT NULL,
  project_type TEXT,
  content TEXT NOT NULL,
  budget TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
