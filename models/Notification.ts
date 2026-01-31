import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for Notification document
interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId; // User receiving the notification
  senderId: mongoose.Types.ObjectId; // User who triggered the notification
  senderName: string; // Sender's full name
  senderEmail: string; // Sender's email
  senderProfilePicture?: string; // Sender's profile picture URL
  fileId: mongoose.Types.ObjectId; // File that was shared
  fileName: string; // Name of the file
  message?: string; // Optional message from sender
  type: 'file_shared'; // Type of notification
  isRead: boolean; // Whether notification has been read
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderEmail: {
      type: String,
      required: true,
    },
    senderProfilePicture: {
      type: String,
      default: null,
    },
    fileId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ['file_shared'],
      default: 'file_shared',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });

const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
