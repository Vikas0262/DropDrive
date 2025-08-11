import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';

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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password, // Password will be hashed by the pre-save hook
    });

    await user.save();

    // Return success response without sensitive data
    const { password: _, ...userWithoutPassword } = user.toObject();
    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: userWithoutPassword 
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        error: 'Registration failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
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