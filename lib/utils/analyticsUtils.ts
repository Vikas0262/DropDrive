import { v4 as uuidv4 } from 'uuid';
import { DeviceType, InteractionType } from '@/types/analytics';

// Generate or retrieve session ID
export function getSessionId(): string {
  const SESSION_KEY = 'dropdrive_analytics_session';
  
  if (typeof window === 'undefined') {
    return uuidv4();
  }

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
}

// Detect device type
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') {
    return DeviceType.UNKNOWN;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    return DeviceType.TABLET;
  }

  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent)) {
    return DeviceType.MOBILE;
  }

  if (width < 768) {
    return DeviceType.MOBILE;
  } else if (width >= 768 && width < 1024) {
    return DeviceType.TABLET;
  }

  return DeviceType.DESKTOP;
}

// Detect browser name
export function detectBrowser(): { name: string; version: string } {
  if (typeof window === 'undefined') {
    return { name: 'Unknown', version: 'Unknown' };
  }

  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';

  // Chrome
  if (/Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor)) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    if (match) browserVersion = match[1];
  }
  // Firefox
  else if (/Firefox/.test(userAgent)) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    if (match) browserVersion = match[1];
  }
  // Safari
  else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    if (match) browserVersion = match[1];
  }
  // Edge
  else if (/Edg/.test(userAgent)) {
    browserName = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    if (match) browserVersion = match[1];
  }
  // Opera
  else if (/OPR/.test(userAgent)) {
    browserName = 'Opera';
    const match = userAgent.match(/OPR\/(\d+)/);
    if (match) browserVersion = match[1];
  }

  return { name: browserName, version: browserVersion };
}

// Detect operating system
export function detectOS(): string {
  if (typeof window === 'undefined') {
    return 'Unknown';
  }

  const userAgent = navigator.userAgent;
  
  if (/Windows NT 10/.test(userAgent)) return 'Windows 10';
  if (/Windows NT 11/.test(userAgent)) return 'Windows 11';
  if (/Windows/.test(userAgent)) return 'Windows';
  if (/Mac OS X/.test(userAgent)) return 'macOS';
  if (/Linux/.test(userAgent)) return 'Linux';
  if (/Android/.test(userAgent)) return 'Android';
  if (/iOS|iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
  
  return 'Unknown';
}

// Get screen resolution
export function getScreenResolution(): string {
  if (typeof window === 'undefined') {
    return 'Unknown';
  }

  return `${window.screen.width}x${window.screen.height}`;
}

// Get device info bundle
export function getDeviceInfo() {
  const browser = detectBrowser();
  
  return {
    deviceType: detectDeviceType(),
    browserName: browser.name,
    browserVersion: browser.version,
    operatingSystem: detectOS(),
    screenResolution: getScreenResolution(),
  };
}

// Time tracking utility
export class TimeTracker {
  private startTime: number;
  private lastUpdateTime: number;
  private totalTime: number;
  private isActive: boolean;
  private updateInterval: NodeJS.Timeout | null;

  constructor() {
    this.startTime = Date.now();
    this.lastUpdateTime = Date.now();
    this.totalTime = 0;
    this.isActive = true;
    this.updateInterval = null;
  }

  start() {
    this.isActive = true;
    this.lastUpdateTime = Date.now();
  }

  pause() {
    if (this.isActive) {
      const now = Date.now();
      const elapsed = Math.floor((now - this.lastUpdateTime) / 1000);
      this.totalTime += elapsed;
      this.isActive = false;
    }
  }

  resume() {
    this.isActive = true;
    this.lastUpdateTime = Date.now();
  }

  getElapsedSeconds(): number {
    if (this.isActive) {
      const now = Date.now();
      const currentElapsed = Math.floor((now - this.lastUpdateTime) / 1000);
      return this.totalTime + currentElapsed;
    }
    return this.totalTime;
  }

  reset() {
    this.startTime = Date.now();
    this.lastUpdateTime = Date.now();
    this.totalTime = 0;
    this.isActive = true;
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// Track analytics event
export async function trackEvent(
  fileId: string,
  sessionId: string,
  interactionType: InteractionType,
  metadata?: any
) {
  try {
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        fileId,
        interactionType,
        metadata,
        deviceInfo: getDeviceInfo(),
      }),
    });

    if (!response.ok) {
      console.error('[Analytics] Failed to track event:', interactionType);
    }
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error);
  }
}

// Update time spent
export async function updateTimeSpent(
  sessionId: string,
  timeSpent: number
) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        fileId: 'placeholder', // Required by API but not used for time updates
        timeSpent,
      }),
    });
  } catch (error) {
    console.error('[Analytics] Error updating time:', error);
  }
}

// Close session
export async function closeSession(sessionId: string, finalTimeSpent: number) {
  try {
    await fetch('/api/analytics/track', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        finalTimeSpent,
      }),
    });
  } catch (error) {
    console.error('[Analytics] Error closing session:', error);
  }
}

// Format time duration
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format full date and time
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
