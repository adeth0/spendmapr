# Supabase Setup

Use these steps to switch SpendMapr from demo mode to real Supabase-backed auth and data.

## 1. Create a Supabase project

- Create a new project in Supabase.
- Open `Project Settings > API`.
- Copy:
  - `Project URL`
  - `anon public` key

## 2. Configure local environment

Update `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

## 3. Configure Auth URLs

In Supabase:

- Go to `Authentication > URL Configuration`
- Set `Site URL` to `http://localhost:3000`
- Add this Redirect URL:
  - `http://localhost:3000/auth/callback`

## 4. Create tables and policies

- Open the SQL editor in Supabase
- Run the contents of `supabase/schema.sql`

## 5. Restart the app

After saving `.env.local`, restart the Next.js dev server so the new environment variables load.
