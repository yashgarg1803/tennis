# Deployment Guide - Sequential Blotto Game

## Prerequisites
- A Vercel account (free at [vercel.com](https://vercel.com))
- Your Supabase project URL and anon key

## Step 1: Prepare Your Repository

Your code is ready for deployment! Make sure you have:
- ✅ All files committed to git
- ✅ No sensitive data in your code
- ✅ Environment variables ready

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your Git repository** (GitHub, GitLab, or Bitbucket)
4. **Configure the project:**
   - Framework Preset: `Next.js`
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (should be auto-detected)
   - Output Directory: `.next` (should be auto-detected)
   - Install Command: `npm install` (should be auto-detected)

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

## Step 3: Configure Environment Variables

After creating your project, you need to add these environment variables in your Vercel dashboard:

### Required Environment Variables:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: Your Supabase project URL
   - Example: `https://your-project-id.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: Your Supabase anon/public key
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### How to Add Environment Variables:

1. Go to your Vercel project dashboard
2. Click on **"Settings"** tab
3. Click on **"Environment Variables"** in the left sidebar
4. Add each variable:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Your Supabase URL
   - **Environment**: Select all (Production, Preview, Development)
5. Repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 4: Configure Supabase for Production

### Update Supabase Auth Settings:

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication > URL Configuration**
3. Add your Vercel domain to **Site URL**:
   - `https://your-project-name.vercel.app`
4. Add your Vercel domain to **Redirect URLs**:
   - `https://your-project-name.vercel.app/auth/callback`

### Update Google OAuth (if using):

1. Go to your **Google Cloud Console**
2. Navigate to **APIs & Services > Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add your Vercel domain to **Authorized JavaScript origins**:
   - `https://your-project-name.vercel.app`
5. Add your Vercel callback URL to **Authorized redirect URIs**:
   - `https://your-project-name.vercel.app/auth/callback`

## Step 5: Test Your Deployment

1. **Visit your Vercel URL** (e.g., `https://your-project-name.vercel.app`)
2. **Test the following features:**
   - ✅ User registration/login
   - ✅ Single-player games
   - ✅ Multiplayer games
   - ✅ Profile page
   - ✅ Game history

## Step 6: Custom Domain (Optional)

1. In your Vercel dashboard, go to **Settings > Domains**
2. Add your custom domain
3. Update your Supabase auth settings with the new domain
4. Update your Google OAuth settings with the new domain

## Troubleshooting

### Common Issues:

1. **"Supabase URL not found"**
   - Check that `NEXT_PUBLIC_SUPABASE_URL` is set correctly
   - Make sure the URL doesn't have trailing slashes

2. **"Authentication failed"**
   - Verify your Supabase anon key is correct
   - Check that your Vercel domain is added to Supabase auth settings

3. **"Google OAuth error"**
   - Ensure your Vercel domain is added to Google OAuth settings
   - Check that redirect URIs are correct

4. **"Build failed"**
   - Check the build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`

### Getting Help:

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)

## Post-Deployment Checklist

- ✅ Environment variables configured
- ✅ Supabase auth settings updated
- ✅ Google OAuth settings updated (if applicable)
- ✅ All features tested
- ✅ Custom domain configured (optional)
- ✅ Analytics/monitoring set up (optional)

Your Sequential Blotto game should now be live and accessible to players worldwide! 🎉 