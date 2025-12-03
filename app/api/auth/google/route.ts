import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

/**
 * ============================================================================
 * GOOGLE OAUTH REDIRECT URI CONFIGURATION CHECKLIST
 * ============================================================================
 * 
 * IMPORTANT: The redirect URI must EXACTLY match in 3 places:
 * 
 * 1. ✅ In your .env file:
 *    OAUTH_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
 * 
 * 2. ✅ In Google Cloud Console:
 *    - Go to: https://console.cloud.google.com/apis/credentials
 *    - Select your OAuth 2.0 Client ID
 *    - Under "Authorized redirect URIs", add EXACTLY:
 *      http://localhost:3000/api/auth/google/callback
 * 
 * 3. ✅ In this code (uses OAUTH_CALLBACK_URL from env)
 * 
 * CHECKLIST:
 * □ Same protocol (http vs https)
 * □ Same domain (localhost vs 127.0.0.1)
 * □ Same port number (3000 vs 5000 etc.)
 * □ Same path (/api/auth/google/callback)
 * □ NO trailing slash at the end
 * □ For production, use https:// not http://
 * 
 * Common mistakes:
 * ❌ http://localhost:3000/api/auth/google/callback/  (trailing slash)
 * ❌ https://localhost:3000/api/auth/google/callback  (https on localhost)
 * ❌ http://127.0.0.1:3000/api/auth/google/callback   (IP instead of localhost)
 * ❌ http://localhost:5000/api/auth/google/callback   (wrong port)
 * 
 * ✅ Correct for local development:
 *    http://localhost:3000/api/auth/google/callback
 * 
 * ✅ Correct for production (example):
 *    https://yourdomain.com/api/auth/google/callback
 * ============================================================================
 */

export async function GET(request: NextRequest) {
  try {
    // Get the callback URL from environment variable
    const callbackURL = process.env.OAUTH_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';
    
    // ========== CRITICAL: COPY THIS EXACT VALUE ==========
    console.log('\n\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🚨 GOOGLE CALLBACK URL - COPY THIS EXACT STRING:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(callbackURL);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n');
    
    console.log('==========================================');
    console.log('🔐 GOOGLE OAUTH CONFIGURATION');
    console.log('==========================================');
    console.log('Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
    console.log('Callback URL (redirect_uri):', callbackURL);
    console.log('==========================================');
    console.log('⚠️  ADD THIS EXACT URL TO GOOGLE CLOUD CONSOLE:');
    console.log('📍', callbackURL);
    console.log('==========================================');
    console.log('Steps:');
    console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
    console.log('2. Click on your OAuth 2.0 Client ID');
    console.log('3. Under "Authorized redirect URIs", add:');
    console.log('   👉', callbackURL);
    console.log('4. Click Save');
    console.log('==========================================');

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      callbackURL  // This MUST match the URL in Google Cloud Console
    );

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
    });

    // Log the full authorization URL (you can inspect the redirect_uri parameter)
    console.log('🔗 Full OAuth URL:', authorizationUrl);
    console.log('==========================================\n');

    return NextResponse.json({ url: authorizationUrl });
  } catch (error: any) {
    console.error('❌ Error generating Google OAuth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication URL' },
      { status: 500 }
    );
  }
}
