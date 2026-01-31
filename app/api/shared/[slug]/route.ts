import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import File from '@/models/File';
import { isValidSlug } from '@/lib/share/generateSlug';

/**
 * GET /api/shared/[slug]
 * Public endpoint: Get file details if it's publicly shared
 * No authentication required, but file must be public and link not expired
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Validate slug format
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { error: 'Invalid share link format' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find file by public slug
    const file = await File.findOne({
      publicSlug: slug,
      isDeleted: false,
    }).select('-cloudinaryPublicId -sharedWith');

    // File not found
    if (!file) {
      return NextResponse.json(
        { error: 'This share link does not exist or has been removed' },
        { status: 404 }
      );
    }

    // Check if public access is enabled
    if (!file.isPublic) {
      return NextResponse.json(
        { error: 'This link is no longer accessible' },
        { status: 403 }
      );
    }

    // Check if link has expired
    if (file.publicLinkExpiry && new Date() > file.publicLinkExpiry) {
      // Auto-disable the public link
      file.isPublic = false;
      await file.save();
      
      return NextResponse.json(
        { error: 'This share link has expired' },
        { status: 403 }
      );
    }

    // Return file metadata (not the full file contents)
    return NextResponse.json(
      {
        id: file._id.toString(),
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileType: file.fileType,
        fileUrl: file.fileUrl,
        uploadTime: file.uploadTime,
        description: file.description || '',
        isFolder: file.isFolder,
        permission: file.publicLinkPermission || 'full-access',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error accessing shared file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to access shared file' },
      { status: 500 }
    );
  }
}
