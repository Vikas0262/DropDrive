import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

/**
 * ============================================================================
 * GITHUB OAUTH CALLBACK HANDLER
 * ============================================================================
 * This endpoint receives the authorization code from GitHub after user consent.
 * ============================================================================
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Get the callback URL (must match the one used in route.ts)
    const callbackURL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback';

    console.log('==========================================');
    console.log('📨 GITHUB OAUTH CALLBACK RECEIVED');
    console.log('==========================================');
    console.log('Callback URL:', callbackURL);
    console.log('Authorization code received:', code ? 'Yes ✅' : 'No ❌');
    console.log('Error from GitHub:', error || 'None');
    console.log('==========================================\n');

    if (error) {
      console.error('❌ GitHub OAuth error:', error);
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

    console.log('🔄 Exchanging authorization code for access token...');

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: callbackURL,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('❌ Token exchange error:', tokenData.error);
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(tokenData.error)}`, request.url)
      );
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('❌ No access token received');
      return NextResponse.redirect(
        new URL('/auth/login?error=Failed to get access token', request.url)
      );
    }

    console.log('✅ Access token received');
    console.log('👤 Fetching user data from GitHub...');

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    const githubUser = await userResponse.json();

    // Get user's primary email
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    const emails = await emailResponse.json();
    const primaryEmail = emails.find((email: any) => email.primary)?.email || emails[0]?.email;

    if (!primaryEmail) {
      console.error('❌ No email found in GitHub account');
      return NextResponse.redirect(
        new URL('/auth/login?error=No email found in GitHub account', request.url)
      );
    }

    console.log('👤 User info retrieved from GitHub:');
    console.log('   Email:', primaryEmail);
    console.log('   Name:', githubUser.name || githubUser.login);
    console.log('==========================================\n');

    // Connect to database
    await dbConnect();

    // Find or create user
    let user = await User.findOne({ email: primaryEmail });

    if (!user) {
      // Create new user with GitHub OAuth
      const nameParts = (githubUser.name || githubUser.login || '').split(' ');
      user = await User.create({
        email: primaryEmail,
        firstName: nameParts[0] || 'User',
        lastName: nameParts.slice(1).join(' ') || '',
        githubId: githubUser.id.toString(),
        authProvider: 'github',
        profilePicture: githubUser.avatar_url || null,
        // Generate a random password for OAuth users (won't be used for login)
        password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12),
      });
      console.log('✅ New user created with GitHub OAuth');
    } else if (!user.githubId) {
      // Link existing user with GitHub account
      user.githubId = githubUser.id.toString();
      user.authProvider = 'github';
      if (githubUser.avatar_url && !user.profilePicture) {
        user.profilePicture = githubUser.avatar_url;
      }
      await user.save();
      console.log('✅ Existing user linked with GitHub account');
    } else {
      console.log('✅ User already exists with GitHub account');
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
    const response = NextResponse.redirect(new URL('/dashboard?oauth=github', request.url));

    // Clear old cookies if they exist (in case user was already logged in with different account)
    response.cookies.delete('user');
    response.cookies.delete('token');
    response.cookies.delete('userData'); // Also clear non-httpOnly user data cookie

    // Set httpOnly token cookie (secure, not accessible to JavaScript)
    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    // Set non-httpOnly user cookie that JavaScript CAN read
    // This is for client-side access, the httpOnly token is for API calls
    response.cookies.set('userData', JSON.stringify(userForCookie), {
      httpOnly: false,  // Allow JavaScript to read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    console.log('✅ GitHub OAuth login successful! Redirecting to dashboard...\n');

    return response;
  } catch (error: any) {
    console.error('❌ GitHub OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(error.message || 'Authentication failed')}`,
        request.url
      )
    );
  }
}
