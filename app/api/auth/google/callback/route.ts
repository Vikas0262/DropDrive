import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

/**
 * ============================================================================
 * GOOGLE OAUTH CALLBACK HANDLER
 * ============================================================================
 * This endpoint receives the authorization code from Google after user consent.
 * 
 * IMPORTANT: The redirect_uri used here MUST exactly match:
 * 1. The one configured in Google Cloud Console
 * 2. The one used when generating the authorization URL
 * 
 * Current callback URL: process.env.OAUTH_CALLBACK_URL
 * Expected value: http://localhost:3000/api/auth/google/callback
 * ============================================================================
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Get the callback URL (must match the one used in route.ts)
    const callbackURL = process.env.OAUTH_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';

    console.log('==========================================');
    console.log('📨 GOOGLE OAUTH CALLBACK RECEIVED');
    console.log('==========================================');
    console.log('Callback URL:', callbackURL);
    console.log('Authorization code received:', code ? 'Yes ✅' : 'No ❌');
    console.log('Error from Google:', error || 'None');
    console.log('Full callback URL:', request.url);
    console.log('==========================================\n');

    if (error) {
      console.error('❌ Google OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      console.error('❌ No authorization code received');
      return NextResponse.redirect(
        new URL('/auth/login?error=No authorization code', request.url)
      );
    }

    // Create OAuth2 client with THE SAME callback URL
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      callbackURL  // CRITICAL: This must match Google Cloud Console
    );

    console.log('🔄 Exchanging authorization code for tokens...');

    console.log('🔄 Exchanging authorization code for tokens...');

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('✅ Tokens received successfully');

    // Get user info from Google
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    });

    const { data } = await oauth2.userinfo.get();

    console.log('👤 User info retrieved from Google:');
    console.log('   Email:', data.email);
    console.log('   Name:', data.name);
    console.log('==========================================\n');

    if (!data.email) {
      return NextResponse.redirect(
        new URL('/auth/login?error=No email from Google', request.url)
      );
    }

    // Connect to database
    await dbConnect();

    // Find or create user
    let user = await User.findOne({ email: data.email });

    if (!user) {
      // Create new user with Google OAuth
      user = await User.create({
        email: data.email,
        firstName: data.given_name || 'User',
        lastName: data.family_name || '',
        googleId: data.id,
        authProvider: 'google',
        profilePicture: data.picture || null,
        // Generate a random password for OAuth users (won't be used for login)
        password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12),
      });
    } else if (!user.googleId) {
      // Link existing user with Google account
      user.googleId = data.id;
      user.authProvider = 'google';
      if (data.picture && !user.profilePicture) {
        user.profilePicture = data.picture;
      }
      await user.save();
    }

    // Create JWT token
    const jwtToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Prepare user data for cookie (without password)
    const userForCookie = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Create response and redirect to dashboard
    const response = NextResponse.redirect(new URL('/dashboard', request.url));

    // Set cookies
    response.cookies.set('user', JSON.stringify(userForCookie), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(error.message || 'Authentication failed')}`,
        request.url
      )
    );
  }
}
