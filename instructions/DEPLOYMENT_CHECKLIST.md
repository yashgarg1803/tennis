# 🚀 Quick Deployment Checklist

## Before Deploying

### ✅ Code Ready
- [ ] All files committed to git
- [ ] No console.log statements in production code
- [ ] No sensitive data in code
- [ ] All features tested locally

### ✅ Environment Variables Ready
- [ ] Supabase URL: `https://your-project-id.supabase.co`
- [ ] Supabase Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Deploy Steps

### 1. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Framework: Next.js (auto-detected)
5. Deploy!

### 2. Add Environment Variables
1. Go to Project Settings > Environment Variables
2. Add `NEXT_PUBLIC_SUPABASE_URL`
3. Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Select all environments (Production, Preview, Development)

### 3. Update Supabase Settings
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add your Vercel URL to Site URL: `https://your-project.vercel.app`
3. Add callback URL: `https://your-project.vercel.app/auth/callback`

### 4. Update Google OAuth (if using)
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Add Vercel domain to Authorized JavaScript origins
3. Add callback URL to Authorized redirect URIs

## Test After Deployment

### ✅ Core Features
- [ ] User can sign in with Google
- [ ] Single-player games work
- [ ] Multiplayer games work
- [ ] Profile page shows stats
- [ ] Game history is saved

### ✅ Edge Cases
- [ ] All-in troops logic works in single-player
- [ ] All-in troops logic works in multiplayer
- [ ] Game ends properly when victory margin reached
- [ ] Ties are handled correctly

## Your Game Will Be Live At:
`https://your-project-name.vercel.app`

## Need Help?
- Check Vercel build logs if deployment fails
- Verify environment variables are set correctly
- Test each feature systematically
- Check browser console for errors

🎉 **Ready to deploy!** Your Sequential Blotto game is going live! 