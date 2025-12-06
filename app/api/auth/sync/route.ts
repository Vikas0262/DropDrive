import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to sync user data from cookies to client localStorage
 * Called when the client detects an OAuth redirect or needs to sync
 */
export async function GET(request: NextRequest) {
  try {
    // Get user and token from cookies
    const userCookie = request.cookies.get('user')?.value;
    const tokenCookie = request.cookies.get('token')?.value;

    if (!userCookie || !tokenCookie) {
      return NextResponse.json(
        { error: 'No user or token in cookies' },
        { status: 401 }
      );
    }

    // Parse and validate user data
    const userData = JSON.parse(userCookie);

    return NextResponse.json(
      {
        user: userData,
        token: tokenCookie,
        synced: true,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error syncing user from cookies:', error);
    return NextResponse.json(
      { error: 'Failed to sync user data' },
      { status: 500 }
    );
  }
}
