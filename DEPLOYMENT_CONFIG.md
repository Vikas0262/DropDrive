# Deployment Configuration Guide

## Summary of Changes

All hardcoded localhost URLs have been removed from the codebase. The application now uses environment variables for all URLs, making it ready for deployment to any domain.

## Files Modified

### 1. **app/api/auth/github/callback/route.ts**
   - **Change**: Removed fallback `'http://localhost:3000/api/auth/github/callback'`
   - **Now**: Uses `process.env.GITHUB_CALLBACK_URL!` (required)

### 2. **app/api/auth/google/callback/route.ts**
   - **Change**: Removed fallback `'http://localhost:3000/api/auth/google/callback'`
   - **Now**: Uses `process.env.OAUTH_CALLBACK_URL!` (required)

### 3. **app/api/auth/forgot/route.ts**
   - **Change**: Removed hardcoded `'http://localhost:3000'` fallback
   - **Now**: Uses `process.env.NEXTAUTH_URL` or `process.env.NEXT_PUBLIC_BASE_URL` with validation

### 4. **app/api/auth/github/route.ts**
   - **Change**: Updated comments to reflect environment variable requirement
   - **Now**: Uses dynamically constructed URL with proper fallback

### 5. **app/api/auth/google/route.ts**
   - **Change**: Updated comments to reflect environment variable requirement
   - **Now**: Uses dynamically constructed URL with proper fallback

### 6. **.env**
   - **Added**: `NEXT_PUBLIC_BASE_URL` variable for public-facing URLs
   - **Cleaned**: Removed duplicate environment variables
   - **Added**: Clear deployment instructions and comments

## Environment Variables Required

### For Local Development
```env
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
OAUTH_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```

### For Production Deployment
Replace with your actual domain:
```env
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com
OAUTH_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
GITHUB_CALLBACK_URL=https://your-domain.com/api/auth/github/callback
```

## Deployment Steps

1. **Update Environment Variables**
   - Set all 4 variables above with your production domain
   - Ensure HTTPS is used for production URLs

2. **Update OAuth Providers**
   
   **GitHub OAuth App:**
   - Go to: https://github.com/settings/developers
   - Select your OAuth App
   - Update "Authorization callback URL" to: `https://your-domain.com/api/auth/github/callback`

   **Google OAuth:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Select your OAuth 2.0 Client ID
   - Update "Authorized redirect URIs" to: `https://your-domain.com/api/auth/google/callback`

3. **Deploy Application**
   - Push your updated code with the environment variable placeholders
   - Set the environment variables in your deployment platform (Vercel, Netlify, etc.)

4. **Test OAuth Flows**
   - Test email/password login (uses NEXT_PUBLIC_BASE_URL for password reset)
   - Test Google login
   - Test GitHub login

## Important Notes

- ⚠️ **No hardcoded URLs remain** in the source code
- ✅ All URLs are environment-variable driven
- ✅ Works seamlessly across local → staging → production environments
- ✅ Password reset emails will use correct domain based on deployment
- ✅ OAuth callbacks will redirect to correct domain

## URL Construction Strategy

The application uses two fallback strategies:

1. **OAuth Callbacks** (GitHub & Google):
   - Primary: Environment variables (`GITHUB_CALLBACK_URL`, `OAUTH_CALLBACK_URL`)
   - These MUST be set, no fallback available

2. **Base URLs** (Password Reset):
   - Primary: `NEXTAUTH_URL`
   - Secondary: `NEXT_PUBLIC_BASE_URL`
   - Tertiary: Dynamic construction from request headers

This ensures maximum flexibility while maintaining security and correctness across all environments.
