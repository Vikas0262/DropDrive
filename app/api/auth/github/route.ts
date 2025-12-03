import { NextRequest, NextResponse } from 'next/server';

/**
 * ============================================================================
 * GITHUB OAUTH REDIRECT URI CONFIGURATION
 * ============================================================================
 * 
 * IMPORTANT: The redirect URI must EXACTLY match in GitHub OAuth App settings:
 * 
 * 1. ✅ In your .env file:
 *    GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
 * 
 * 2. ✅ In GitHub Settings:
 *    - Go to: https://github.com/settings/developers
 *    - Select your OAuth App
 *    - Set "Authorization callback URL" to:
 *      http://localhost:3000/api/auth/github/callback
 * 
 * ============================================================================
 */

export async function GET(request: NextRequest) {
  try {
    // Get configuration from environment variables
    const clientId = process.env.GITHUB_CLIENT_ID;
    const callbackURL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback';
    
    console.log('\n\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔐 GITHUB OAUTH CONFIGURATION');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Client ID:', clientId?.substring(0, 10) + '...');
    console.log('Callback URL (redirect_uri):', callbackURL);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('⚠️  ADD THIS EXACT URL TO GITHUB OAUTH APP:');
    console.log('📍', callbackURL);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Steps:');
    console.log('1. Go to: https://github.com/settings/developers');
    console.log('2. Click on your OAuth App');
    console.log('3. Set "Authorization callback URL" to:');
    console.log('   👉', callbackURL);
    console.log('4. Click "Update application"');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!clientId) {
      return NextResponse.json(
        { error: 'GitHub Client ID not configured' },
        { status: 500 }
      );
    }

    // GitHub OAuth authorization URL
    const authorizationUrl = new URL('https://github.com/login/oauth/authorize');
    authorizationUrl.searchParams.append('client_id', clientId);
    authorizationUrl.searchParams.append('redirect_uri', callbackURL);
    authorizationUrl.searchParams.append('scope', 'user:email read:user');
    authorizationUrl.searchParams.append('state', Math.random().toString(36).substring(7));

    console.log('🔗 Full GitHub OAuth URL:', authorizationUrl.toString());
    console.log('═══════════════════════════════════════════════════════════════\n');

    return NextResponse.json({ url: authorizationUrl.toString() });
  } catch (error: any) {
    console.error('❌ Error generating GitHub OAuth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication URL' },
      { status: 500 }
    );
  }
}
