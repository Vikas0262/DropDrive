import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { authController } from '@/lib/controllers/authController';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Login user
    const user = await authController.login(email, password);

    // Remove profilePicture from response to avoid headers too big error
    const { profilePicture: _, ...userWithoutImage } = user;

    // Create response with user data
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: userWithoutImage,
      },
      { status: 200 }
    );

    // Set user session cookie (without large profilePicture)
    response.cookies.set('user', JSON.stringify(userWithoutImage), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Login failed',
      },
      { status: 401 }
    );
  }
}
