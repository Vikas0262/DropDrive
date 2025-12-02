import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const includeImage = searchParams.get('includeImage') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userObj = user.toObject();
    const { password: _, ...userWithoutPassword } = userObj;

    // Only include profilePicture if explicitly requested
    if (!includeImage) {
      const { profilePicture: __, ...userWithoutImage } = userWithoutPassword;
      return NextResponse.json(
        {
          message: 'User profile fetched successfully',
          user: userWithoutImage,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: 'User profile fetched successfully',
        user: userWithoutPassword,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, firstName, lastName, profilePicture } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    const userObj = user.toObject();
    const { password: _, profilePicture: __, ...userWithoutSensitiveData } = userObj;

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: userWithoutSensitiveData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
