# SpendMapr Deployment Guide

This guide explains how to deploy SpendMapr as a static site to GitHub Pages.

## Overview

SpendMapr has been converted from a Next.js application to a static React application using Vite. The application is now fully static and can be deployed to any static hosting service, including GitHub Pages.

## Key Changes Made

### 1. Framework Migration
- **From**: Next.js (SSR/SSG)
- **To**: React + Vite (Static)
- **Benefits**: 
  - No server requirements
  - Faster builds
  - Better suited for static hosting
  - Smaller bundle size

### 2. Supabase Integration
- **Client-side only**: Removed server-side Supabase dependencies
- **Environment variables**: Moved to Vite environment variables (VITE_ prefix)
- **Demo mode**: Automatic fallback when Supabase is not configured
- **Security**: No server-side secrets exposed

### 3. Build System
- **Build command**: `npm run build`
- **Output directory**: `dist/`
- **Base path**: `/` (configured for GitHub Pages subdomain)
- **Optimization**: Code splitting, tree shaking, and compression

### 4. Mobile Responsiveness
- **Responsive layout**: Flexbox and CSS Grid
- **Mobile-first design**: Optimized for mobile devices
- **Touch-friendly**: Large buttons and interactive elements
- **Scalable typography**: Uses rem units for consistent scaling

## Prerequisites

1. **Node.js**: Version 18 or higher
2. **npm**: Version 8 or higher
3. **GitHub account**: For repository hosting
4. **Supabase project**: Optional (demo mode available)

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/spendmapr.git
cd spendmapr
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

#### Option A: Demo Mode (No Configuration Required)
The application will automatically run in demo mode with sample data.

#### Option B: Production with Supabase

1. **Create Supabase Project**:
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Get your API URL and anon key from Settings > API

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env.local
   ```

3. **Edit .env.local**:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # Optional: TrueLayer Data API (UK Open Banking)
   # TRUELAYER_CLIENT_ID=your-truelayer-client-id
   # TRUELAYER_CLIENT_SECRET=your-truelayer-client-secret
   # TRUELAYER_REDIRECT_URI=http://localhost:3000/api/truelayer/callback
   ```

## Development

### Start Development Server
```bash
npm run dev
```
Visit `http://localhost:3000` to view the application.

### Build for Production
```bash
npm run build
```
This creates optimized static files in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```
Serves the built files locally to test the production build.

## GitHub Pages Deployment

### Method 1: Automatic Deployment (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

2. **Configure GitHub Pages**:
   - Go to your repository on GitHub
   - Click **Settings** > **Pages**
   - Under **Source**, select **Deploy from a branch**
   - Select **main** branch and **/(root)** folder
   - Click **Save**

3. **Wait for Deployment**:
   - GitHub will build and deploy your site
   - Visit `https://your-username.github.io/spendmapr` when ready

### Method 2: Manual Deployment

1. **Build the Project**:
   ```bash
   npm run build
   ```

2. **Copy Files to gh-pages Branch**:
   ```bash
   git checkout -b gh-pages
   rm -rf *
   cp -r dist/* .
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin gh-pages --force
   ```

3. **Configure GitHub Pages**:
   - Go to repository **Settings** > **Pages**
   - Select **gh-pages** branch
   - Save changes

## Custom Domain (Optional)

1. **Add CNAME File**:
   Create a `CNAME` file in the root directory:
   ```
   spend.kavauralabs.com
   ```

2. **Configure DNS**:
   Add a CNAME record pointing to `your-username.github.io`

3. **Update GitHub Pages**:
   - Go to **Settings** > **Pages**
   - Enter your custom domain
   - Enable HTTPS

## Environment Variables in Production

GitHub Pages doesn't support environment variables at build time. For production deployment:

1. **Build with Production Variables**:
   ```bash
   VITE_SUPABASE_URL=your-production-url VITE_SUPABASE_ANON_KEY=your-production-key npm run build
   ```

2. **Or use .env.production**:
   Create `.env.production` with your production values.

## Troubleshooting

### Common Issues

1. **404 Errors on Refresh**:
   - GitHub Pages doesn't support client-side routing by default
   - Solution: Add a `404.html` file that redirects to `index.html`

2. **Supabase Not Working**:
   - Check environment variables are correctly set
   - Verify Supabase project settings allow your domain

3. **Build Failures**:
   - Ensure Node.js version is compatible
   - Clear npm cache: `npm cache clean --force`
   - Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`

### Performance Optimization

1. **Bundle Analysis**:
   ```bash
   npm run build -- --mode analyze
   ```

2. **Image Optimization**:
   - Use WebP format for images
   - Compress images before adding to project

3. **Code Splitting**:
   - Vite automatically handles code splitting
   - Consider lazy loading heavy components

## Security Considerations

1. **No Server-Side Secrets**: All secrets are client-side only
2. **CORS Configuration**: Ensure Supabase allows your domain
3. **HTTPS**: GitHub Pages automatically provides HTTPS
4. **Content Security Policy**: Consider adding CSP headers

## Support

- **Documentation**: [Supabase Docs](https://supabase.com/docs)
- **Vite Docs**: [Vite Documentation](https://vitejs.dev/)
- **GitHub Issues**: Report bugs and feature requests

## Next Steps

1. **Database Setup**: Configure Supabase database schema
2. **Authentication**: Set up email/password or OAuth providers
3. **Bank Integration**: Configure TrueLayer for banking data
4. **Monitoring**: Add analytics and error tracking
5. **Testing**: Implement unit and integration tests