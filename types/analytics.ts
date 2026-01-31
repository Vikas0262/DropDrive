// Analytics Types for Frontend

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

export interface Interaction {
  type: InteractionType;
  timestamp: string;
  metadata?: any;
}

export interface AnalyticsSession {
  _id: string;
  sessionId: string;
  viewerUserId?: string;
  viewerEmail?: string;
  viewerIp?: string;
  viewerLocation?: {
    country?: string;
    city?: string;
  };
  deviceType: DeviceType;
  browserName?: string;
  browserVersion?: string;
  operatingSystem?: string;
  screenResolution?: string;
  interactions: Interaction[];
  firstViewedAt: string;
  lastViewedAt: string;
  totalTimeSpent: number;
  isActiveSession: boolean;
  permission: 'secure-view' | 'full-access';
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  uniqueViewers: number;
  averageTimeSpent: number; // in seconds
  interactionCounts: {
    view: number;
    download: number;
    download_blocked: number;
    screenshot_attempt: number;
    copy_attempt: number;
    print_attempt: number;
  };
  viewsByDate: Array<{
    date: string;
    count: number;
  }>;
  viewsByDevice: Array<{
    deviceType: DeviceType;
    count: number;
  }>;
  viewsByLocation: Array<{
    country: string;
    count: number;
  }>;
  topBrowsers: Array<{
    browserName: string;
    count: number;
  }>;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  sessions: AnalyticsSession[];
  hasMore: boolean;
  total: number;
}

// For tracking on client side
export interface TrackingPayload {
  sessionId: string;
  fileId: string;
  interactionType?: InteractionType;
  timeSpent?: number;
  deviceInfo?: {
    deviceType: DeviceType;
    browserName?: string;
    browserVersion?: string;
    operatingSystem?: string;
    screenResolution?: string;
  };
  metadata?: any;
}
