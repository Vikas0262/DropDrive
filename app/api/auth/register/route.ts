import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { authController } from '@/lib/controllers/authController';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const { firstName, lastName, email, password, confirmPassword } = await request.json();

    // Validate input
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Register user using controller
    const user = await authController.register(firstName, lastName, email, password);

    // Remove profilePicture from response to avoid headers too big error
    const { profilePicture: _, ...userWithoutImage } = user;

    // Create response
    const response = NextResponse.json(
      { 
        message: 'User registered successfully',
        user: userWithoutImage,
      },
      { status: 201 }
    );

    // Set authentication token cookie
    response.cookies.set('token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    // Set user session cookie
    response.cookies.set('user', JSON.stringify(userWithoutImage), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Registration failed',
      },
      { status: 400 }
    );
  }
}

// Add TypeScript type for the request body
type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};