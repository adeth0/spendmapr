# SpendMapr

SpendMapr is a full-stack personal finance app built with Next.js, Tailwind CSS, and Supabase.

## Quick Start

1. Install dependencies with `npm install`
2. Review `.env.local` and add your Supabase values
3. Run `supabase/schema.sql` in your Supabase SQL editor
4. Set Supabase Auth redirect URL to `http://localhost:3000/auth/callback`
5. Start with `npm run dev`

## Local Environment

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

## Setup Guide

For the full checklist, see `SUPABASE_SETUP.md`.
