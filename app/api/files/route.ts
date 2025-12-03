import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import File from '@/models/File';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'my-drive'; // my-drive, shared, recent, starred, trash, all-folders
    const folderId = searchParams.get('folderId');

    const query: any = { isDeleted: false };

    switch (filter) {
      case 'my-drive':
        query.userId = new mongoose.Types.ObjectId(userId);
        // Only show root-level items (folderId is null) OR items inside a specific folder
        if (folderId) {
          // When browsing inside a folder, show items with that folderId
          query.folderId = new mongoose.Types.ObjectId(folderId);
        } else {
          // At root level, only show items where folderId is null (not nested inside any folder)
          query.folderId = null;
        }
        break;

      case 'all-folders':
        query.userId = new mongoose.Types.ObjectId(userId);
        query.isFolder = true;
        break;

      case 'shared':
        query['sharedWith.userId'] = new mongoose.Types.ObjectId(userId);
        break;

      case 'recent':
        query.userId = new mongoose.Types.ObjectId(userId);
        break;

      case 'starred':
        query.userId = new mongoose.Types.ObjectId(userId);
        query.starred = true;
        break;

      case 'trash':
        query.isDeleted = true;
        query.userId = new mongoose.Types.ObjectId(userId);
        break;
    }

    let fileQuery = File.find(query);

    if (filter === 'recent') {
      fileQuery = fileQuery.sort({ lastModified: -1 });
    } else {
      fileQuery = fileQuery.sort({ uploadTime: -1 });
    }

    const files = await fileQuery.select('-cloudinaryPublicId');

    // For shared filter, also get shared files
    let sharedCount = 0;
    if (filter === 'my-drive') {
      sharedCount = await File.countDocuments({
        'sharedWith.userId': new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      });
    }

    return NextResponse.json(
      {
        files: files.map((f) => ({
          id: f._id.toString(),
          fileName: f.fileName,
          fileSize: f.fileSize,
          fileType: f.fileType,
          uploadTime: f.uploadTime,
          lastModified: f.lastModified,
          starred: f.starred,
          sharedWith: f.sharedWith.length,
          fileUrl: f.fileUrl,
          isFolder: f.isFolder,
          isDeleted: f.isDeleted,
          folderId: f.folderId ? f.folderId.toString() : null,
        })),
        sharedCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('File fetch error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch files',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { action, fileId, data } = body;

    // Handle create-folder action first (doesn't need fileId)
    if (action === 'create-folder') {
      if (!data.folderName) {
        return NextResponse.json(
          { error: 'Folder name required' },
          { status: 400 }
        );
      }

      // Check if parentFolderId is provided and valid
      let parentFolderId = null;
      if (data.parentFolderId) {
        const parentFolder = await File.findById(data.parentFolderId);
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
        parentFolderId = new mongoose.Types.ObjectId(data.parentFolderId);
      }

      const newFolder = new File({
        userId: new mongoose.Types.ObjectId(userId),
        fileName: data.folderName,
        fileType: 'folder',
        fileSize: 0,
        uploadTime: new Date(),
        lastModified: new Date(),
        starred: false,
        sharedWith: [],
        isDeleted: false,
        isFolder: true,
        fileUrl: null,
        cloudinaryPublicId: null,
        folderId: parentFolderId,
      });

      await newFolder.save();
      return NextResponse.json(
        { message: 'Folder created', folder: newFolder },
        { status: 201 }
      );
    }

    // For all other actions, fetch the file
    const file = await File.findById(fileId);
    if (!file || file.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'File not found or unauthorized' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'star': {
        file.starred = !file.starred;
        await file.save();
        return NextResponse.json(
          { message: 'Star toggled', starred: file.starred },
          { status: 200 }
        );
      }

      case 'rename': {
        if (!data.newName) {
          return NextResponse.json(
            { error: 'New name required' },
            { status: 400 }
          );
        }
        file.fileName = data.newName;
        file.lastModified = new Date();
        await file.save();
        return NextResponse.json(
          { message: 'File renamed', fileName: file.fileName },
          { status: 200 }
        );
      }

      case 'share': {
        if (!data.userEmail || !data.permission) {
          return NextResponse.json(
            { error: 'User email and permission required' },
            { status: 400 }
          );
        }

        const User = (await import('@/models/User')).default;
        const sharedUser = await User.findOne({ email: data.userEmail });
        if (!sharedUser) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        const alreadyShared = file.sharedWith.some(
          (s: any) => s.userId.toString() === sharedUser._id.toString()
        );
        if (!alreadyShared) {
          file.sharedWith.push({
            userId: sharedUser._id,
            permission: data.permission,
          });
          await file.save();
        }

        return NextResponse.json(
          { message: 'File shared', sharedWith: file.sharedWith },
          { status: 200 }
        );
      }

      case 'delete': {
        // Soft delete: mark as deleted
        file.isDeleted = true;
        file.deletedAt = new Date();
        await file.save();
        
        // If it's a folder, also soft delete all children recursively
        if (file.isFolder) {
          await File.updateMany(
            { folderId: file._id, isDeleted: false },
            { isDeleted: true, deletedAt: new Date() }
          );
        }
        
        return NextResponse.json(
          { message: 'File moved to trash' },
          { status: 200 }
        );
      }

      case 'restore': {
        file.isDeleted = false;
        file.deletedAt = undefined;
        await file.save();
        
        // If it's a folder, also restore all children recursively
        if (file.isFolder) {
          await File.updateMany(
            { folderId: file._id },
            { isDeleted: false, deletedAt: undefined }
          );
        }
        
        return NextResponse.json(
          { message: 'File restored' },
          { status: 200 }
        );
      }

      case 'permanent-delete': {
        // Hard delete: remove from database
        // If it's a folder, delete all children first
        if (file.isFolder) {
          // Find all descendants (direct and nested children)
          const children = await File.find({ folderId: file._id });
          
          // Delete Cloudinary assets for all children
          for (const child of children) {
            if (child.cloudinaryPublicId) {
              await cloudinary.uploader.destroy(child.cloudinaryPublicId);
            }
          }
          
          // Delete all children from database
          await File.deleteMany({ folderId: file._id });
        }
        
        // Delete the file/folder itself from Cloudinary
        if (file.cloudinaryPublicId) {
          await cloudinary.uploader.destroy(file.cloudinaryPublicId);
        }
        
        // Delete from database
        await File.findByIdAndDelete(fileId);
        
        return NextResponse.json(
          { message: 'File permanently deleted' },
          { status: 200 }
        );
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('File action error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Action failed',
      },
      { status: 500 }
    );
  }
}
