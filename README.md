# AI Business OS 🚀

Ek platform jahan alag alag tools ki zaroorat na pade.

## Features
- 🔍 SEO Audit — AI-powered website analysis
- ✍️ Content Generator — Blog, LinkedIn, Email, Ads
- 🎯 Lead Discovery — AI finds your ideal prospects
- 📄 Proposal Generator — Professional proposals in seconds
- 👥 CRM — Client management
- ⚡ Dashboard — Business intelligence

## Setup (5 minutes)

### Step 1 — Clone & Install
```bash
npm install
```

### Step 2 — Environment Variables
Create `.env.local` file in root:
```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get free API key: https://openrouter.ai

### Step 3 — Database (Optional)
- Go to https://supabase.com
- Create project
- Open SQL Editor
- Paste contents of `database/schema.sql`
- Run

### Step 4 — Run
```bash
npm run dev
```
Open http://localhost:3000

## Deploy to Vercel
1. Push code to GitHub
2. Go to vercel.com → New Project → Import repo
3. Add environment variables in Vercel dashboard
4. Deploy ✅

## File Structure
```
app/
  page.tsx          — Homepage
  dashboard/        — Main dashboard
  audit/            — SEO audit tool
  content/          — Content generator
  proposal/         — Proposal generator
  leads/            — Lead discovery
  crm/              — Client CRM
  settings/         — Settings
  api/              — Backend API routes

components/         — Reusable UI components
lib/
  openrouter.ts     — AI integration (FREE)
  supabase.ts       — Database
  utils.ts          — Helpers
database/
  schema.sql        — Supabase tables
```
