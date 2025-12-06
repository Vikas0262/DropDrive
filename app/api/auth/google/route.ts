import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

/**
 * ============================================================================
 * GOOGLE OAUTH REDIRECT URI CONFIGURATION
 * ============================================================================
 * 
 * REQUIRED ENVIRONMENT VARIABLES:
 * - OAUTH_CALLBACK_URL (e.g., http://localhost:3000/api/auth/google/callback for local,
 *                              https://yourdomain.com/api/auth/google/callback for production)
 * - NEXTAUTH_URL (used as fallback for dynamic URL construction)
 * 
 * Setup in Google Cloud Console:
 * 1. Go to: https://console.cloud.google.com/apis/credentials
 * 2. Select your OAuth 2.0 Client ID
 * 3. Under "Authorized redirect URIs", add your OAUTH_CALLBACK_URL value
 * 
 * URL Requirements:
 * ✅ Same protocol (http for local, https for production)
 * ✅ Same domain (localhost for local, yourdomain.com for production)
 * ✅ Same port number (3000 for local, default 443 for production)
 * ✅ Same path (/api/auth/google/callback)
 * ✅ NO trailing slash at the end
 * 
 * Examples:
 * ✅ Local:      http://localhost:3000/api/auth/google/callback
 * ✅ Production: https://yourdomain.com/api/auth/google/callback
 * ============================================================================
 */

export async function GET(request: NextRequest) {
  try {
    // Get the callback URL from environment variable
    // Use OAUTH_CALLBACK_URL if set, otherwise construct from NEXTAUTH_URL or request origin
    const callbackURL = process.env.OAUTH_CALLBACK_URL || 
      `${process.env.NEXTAUTH_URL || `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`}/api/auth/google/callback`;
    
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
