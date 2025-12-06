import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import File from '@/models/File';
import User from '@/models/User';
import { v2 as cloudinary } from 'cloudinary';
import { generatePublicSlug } from '@/lib/share/generateSlug';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request headers or session
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User ID required' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate parent folder if provided
    if (folderId) {
      const parentFolder = await File.findById(folderId);
      if (!parentFolder || parentFolder.userId.toString() !== userId) {
        return NextResponse.json(
          { error: 'Parent folder not found or unauthorized' },
          { status: 404 }
        );
      }
      // Ensure parent is actually a folder, not a file
      if (!parentFolder.isFolder) {
        return NextResponse.json(
          { error: 'Parent must be a folder' },
          { status: 400 }
        );
      }
    }

    // Read file as buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine file type and MIME
    const fileName = file.name;
    const fileSize = buffer.length;
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Map file extension to readable type
    const fileTypeMap: Record<string, string> = {
      pdf: 'pdf',
      doc: 'document',
      docx: 'document',
      xls: 'spreadsheet',
      xlsx: 'spreadsheet',
      ppt: 'presentation',
      pptx: 'presentation',
      jpg: 'image',
      jpeg: 'image',
      png: 'image',
      gif: 'image',
      mp4: 'video',
      avi: 'video',
      mov: 'video',
      txt: 'text',
      zip: 'archive',
      rar: 'archive',
    };
    
    const fileType = fileTypeMap[fileExtension] || fileExtension;

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `dropdrive/${userId}`,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    const cloudinaryResult = uploadResult as any;

    // Generate unique public slug for sharing
    let publicSlug = generatePublicSlug();
    let existingFile = await File.findOne({ publicSlug });
    while (existingFile) {
      publicSlug = generatePublicSlug();
      existingFile = await File.findOne({ publicSlug });
    }

    // Create file record in MongoDB
    const newFile = await File.create({
      userId,
      folderId: folderId || null,
      fileName,
      fileSize,
      fileType,
      uploadTime: new Date(),
      lastModified: new Date(),
      starred: false,
      sharedWith: [],
      isDeleted: false,
      isFolder: false,
      fileUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      description: '',
      publicSlug, // Store the generated slug
      isPublic: false, // Default to private
      publicLinkExpiry: null,
    });

    return NextResponse.json(
      {
        message: 'File uploaded successfully',
        file: {
          id: newFile._id.toString(),
          _id: newFile._id.toString(),
          fileName: newFile.fileName,
          fileSize: newFile.fileSize,
          fileType: newFile.fileType,
          uploadTime: newFile.uploadTime,
          lastModified: newFile.lastModified,
          starred: newFile.starred,
          sharedWith: newFile.sharedWith,
          fileUrl: newFile.fileUrl,
          isFolder: false,
          isDeleted: false,
          publicSlug: newFile.publicSlug,
          isPublic: newFile.isPublic,
          publicLink: newFile.publicSlug
            ? `https://dropdrive.com/shared/${newFile.publicSlug}`
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      {
        error: error.message || 'File upload failed',
      },
      { status: 500 }
    );
  }
}
