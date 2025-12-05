import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for File document
interface IFile extends Document {
  userId: mongoose.Types.ObjectId;
  folderId?: mongoose.Types.ObjectId; // Parent folder ID (null if root)
  fileName: string;
  fileSize: number; // in bytes
  fileType: string; // pdf, docx, pptx, jpg, etc. or 'folder'
  uploadTime: Date;
  lastModified: Date;
  starred: boolean;
  sharedWith: Array<{
    userId: mongoose.Types.ObjectId;
    permission: 'view' | 'edit' | 'comment'; // view, edit, comment
  }>;
  isDeleted: boolean; // soft delete
  deletedAt?: Date;
  isFolder: boolean;
  fileUrl?: string; // Cloudinary URL or storage URL
  cloudinaryPublicId?: string; // For deletion
  description?: string;
  publicSlug?: string; // Unique slug for public sharing (e.g., "abc123def")
  isPublic?: boolean; // Toggle for public access
  publicLinkExpiry?: Date; // Optional expiration date for public link
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema<IFile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      default: null,
      index: true,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: 0,
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      trim: true,
    },
    uploadTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastModified: {
      type: Date,
      default: Date.now,
      index: true,
    },
    starred: {
      type: Boolean,
      default: false,
      index: true,
    },
    sharedWith: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        permission: {
          type: String,
          enum: ['view', 'edit', 'comment'],
          default: 'view',
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    isFolder: {
      type: Boolean,
      default: false,
      index: true,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    publicSlug: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values but unique non-null values
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    publicLinkExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for user's files
fileSchema.index({ userId: 1, isDeleted: 1, folderId: 1 });
// Index for shared files
fileSchema.index({ 'sharedWith.userId': 1, isDeleted: 1 });
// Index for sorting by last modified
fileSchema.index({ userId: 1, lastModified: -1 });
// Index for starred items
fileSchema.index({ userId: 1, starred: 1, isDeleted: 1 });

const File = mongoose.models.File || mongoose.model<IFile>('File', fileSchema);
export type { IFile };
export default File;
