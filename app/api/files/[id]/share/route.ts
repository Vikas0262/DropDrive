import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import File from '@/models/File';
import { generatePublicSlug } from '@/lib/share/generateSlug';

/**
 * GET /api/files/[id]/share
 * Get public sharing status and details for a file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let userId = request.headers.get('x-user-id');
    
    // For development/demo: allow requests without user ID and use demo data
    // In production, this should require authentication
    if (!userId) {
      // Try to get from cookie or session if available
      const authToken = request.headers.get('authorization')
      if (!authToken && process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      // For demo purposes, use a default user ID
      userId = 'demo-user-' + Math.random().toString(36).substr(2, 9)
    }

    await dbConnect()

    const file = await File.findById(id)
    if (!file) {
      // Return demo data for development
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json(
          {
            id: id,
            fileName: 'sample-file',
            isPublic: false,
            publicSlug: null,
            publicLink: null,
            publicLinkExpiry: null,
          },
          { status: 200 }
        )
      }

      return NextResponse.json(
        { error: 'File not found or unauthorized' },
        { status: 404 }
      )
    }

    // For demo, skip ownership check
    // In production, verify: if (file.userId.toString() !== userId)

    return NextResponse.json(
      {
        id: file._id.toString(),
        fileName: file.fileName,
        isPublic: file.isPublic || false,
        publicSlug: file.publicSlug || null,
        publicLink: file.publicSlug
          ? `/shared/${file.publicSlug}`
          : null,
        publicLinkExpiry: file.publicLinkExpiry || null,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching share status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch share status' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/files/[id]/share
 * Toggle public access or update public link settings
 * Body: { isPublic: boolean, expiryDays?: number }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let userId = request.headers.get('x-user-id');
    
    // For development/demo: allow requests without user ID
    if (!userId) {
      const authToken = request.headers.get('authorization')
      if (!authToken && process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      // For demo purposes, use a default user ID
      userId = 'demo-user-' + Math.random().toString(36).substr(2, 9)
    }

    await dbConnect();

    const file = await File.findById(id);
    if (!file) {
      return NextResponse.json(
        { error: 'File not found or unauthorized' },
        { status: 404 }
      );
    }

    // For demo, skip ownership check
    // In production, verify: if (file.userId.toString() !== userId)

    const body = await request.json();
    const { isPublic, expiryDays } = body;

    if (typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { error: 'isPublic must be a boolean' },
        { status: 400 }
      );
    }

    // If enabling public link and no slug exists, generate one
    if (isPublic && !file.publicSlug) {
      let newSlug = generatePublicSlug();
      
      // Ensure slug uniqueness (extremely unlikely, but handle it)
      let existingFile = await File.findOne({ publicSlug: newSlug });
      while (existingFile) {
        newSlug = generatePublicSlug();
        existingFile = await File.findOne({ publicSlug: newSlug });
      }
      
      file.publicSlug = newSlug;
    }

    // Set expiry date if specified
    if (isPublic && expiryDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      file.publicLinkExpiry = expiryDate;
    } else if (isPublic) {
      // If enabling without expiry, clear any existing expiry
      file.publicLinkExpiry = null;
    }

    file.isPublic = isPublic;
    await file.save();

    return NextResponse.json(
      {
        message: `Public link ${isPublic ? 'enabled' : 'disabled'}`,
        isPublic: file.isPublic,
        publicSlug: file.publicSlug || null,
        publicLink: file.publicSlug
          ? `/shared/${file.publicSlug}`
          : null,
        publicLinkExpiry: file.publicLinkExpiry || null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating share status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update share status' },
      { status: 500 }
    );
  }
}
