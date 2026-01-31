import mongoose, { Document, Schema, Model } from 'mongoose';

// Enums for tracking
export enum InteractionType {
  VIEW = 'view',
  DOWNLOAD = 'download',
  DOWNLOAD_BLOCKED = 'download_blocked',
  SCREENSHOT_ATTEMPT = 'screenshot_attempt',
  COPY_ATTEMPT = 'copy_attempt',
  PRINT_ATTEMPT = 'print_attempt',
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  UNKNOWN = 'unknown',
}

// Interface for Analytics Document
export interface IDocumentAnalytics extends Document {
  fileId: mongoose.Types.ObjectId;
  sessionId: string; // Unique session identifier
  viewerUserId?: mongoose.Types.ObjectId; // If logged-in user
  viewerEmail?: string; // If shared via email
  viewerIp?: string; // Masked IP for privacy
  viewerLocation?: {
    country?: string;
    city?: string;
  };
  deviceType: DeviceType;
  browserName?: string;
  browserVersion?: string;
  operatingSystem?: string;
  screenResolution?: string;
  interactions: Array<{
    type: InteractionType;
    timestamp: Date;
    metadata?: any; // Additional context
  }>;
  firstViewedAt: Date;
  lastViewedAt: Date;
  totalTimeSpent: number; // in seconds
  isActiveSession: boolean;
  permission: 'secure-view' | 'full-access'; // Permission level at time of access
  createdAt: Date;
  updatedAt: Date;
}

// Schema Definition
const DocumentAnalyticsSchema = new Schema<IDocumentAnalytics>(
  {
    fileId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    viewerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    viewerEmail: {
      type: String,
      index: true,
    },
    viewerIp: {
      type: String,
      // Masked for privacy: e.g., "192.168.xxx.xxx"
    },
    viewerLocation: {
      country: String,
      city: String,
    },
    deviceType: {
      type: String,
      enum: Object.values(DeviceType),
      default: DeviceType.UNKNOWN,
    },
    browserName: String,
    browserVersion: String,
    operatingSystem: String,
    screenResolution: String,
    interactions: [
      {
        type: {
          type: String,
          enum: Object.values(InteractionType),
          required: true,
        },
        timestamp: {
          type: Date,
          required: true,
          default: Date.now,
        },
        metadata: Schema.Types.Mixed,
      },
    ],
    firstViewedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastViewedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    totalTimeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActiveSession: {
      type: Boolean,
      default: true,
    },
    permission: {
      type: String,
      enum: ['secure-view', 'full-access'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
DocumentAnalyticsSchema.index({ fileId: 1, createdAt: -1 });
DocumentAnalyticsSchema.index({ fileId: 1, sessionId: 1 });
DocumentAnalyticsSchema.index({ fileId: 1, viewerUserId: 1 });
DocumentAnalyticsSchema.index({ sessionId: 1, isActiveSession: 1 });

// Static methods
DocumentAnalyticsSchema.statics = {
  // Get total views for a file
  async getTotalViews(fileId: string): Promise<number> {
    return this.countDocuments({ fileId: new mongoose.Types.ObjectId(fileId) });
  },

  // Get unique viewers count
  async getUniqueViewers(fileId: string): Promise<number> {
    const result = await this.aggregate([
      { $match: { fileId: new mongoose.Types.ObjectId(fileId) } },
      {
        $group: {
          _id: {
            $cond: [
              { $ne: ['$viewerUserId', null] },
              '$viewerUserId',
              { $cond: [{ $ne: ['$viewerEmail', null] }, '$viewerEmail', '$viewerIp'] },
            ],
          },
        },
      },
      { $count: 'uniqueViewers' },
    ]);
    return result[0]?.uniqueViewers || 0;
  },

  // Get average time spent
  async getAverageTimeSpent(fileId: string): Promise<number> {
    const result = await this.aggregate([
      { $match: { fileId: new mongoose.Types.ObjectId(fileId) } },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$totalTimeSpent' },
        },
      },
    ]);
    return Math.round(result[0]?.avgTime || 0);
  },

  // Get interaction counts
  async getInteractionCounts(fileId: string) {
    const result = await this.aggregate([
      { $match: { fileId: new mongoose.Types.ObjectId(fileId) } },
      { $unwind: '$interactions' },
      {
        $group: {
          _id: '$interactions.type',
          count: { $sum: 1 },
        },
      },
    ]);
    
    const counts: Record<string, number> = {};
    result.forEach((item) => {
      counts[item._id] = item.count;
    });
    return counts;
  },
};

// Instance methods
DocumentAnalyticsSchema.methods = {
  // Add an interaction
  addInteraction(type: InteractionType, metadata?: any) {
    this.interactions.push({
      type,
      timestamp: new Date(),
      metadata,
    });
    this.lastViewedAt = new Date();
    return this.save();
  },

  // Update time spent
  updateTimeSpent(seconds: number) {
    this.totalTimeSpent += seconds;
    this.lastViewedAt = new Date();
    return this.save();
  },

  // Close session
  closeSession() {
    this.isActiveSession = false;
    return this.save();
  },
};

// Model
const DocumentAnalytics: Model<IDocumentAnalytics> =
  mongoose.models.DocumentAnalytics ||
  mongoose.model<IDocumentAnalytics>('DocumentAnalytics', DocumentAnalyticsSchema);

export default DocumentAnalytics;
