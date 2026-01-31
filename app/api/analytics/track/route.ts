import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import DocumentAnalytics from '@/models/DocumentAnalytics';
import { InteractionType, DeviceType } from '@/types/analytics';
import mongoose from 'mongoose';

// Rate limiting map to prevent spam (in-memory, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute per session

// Check rate limit
function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(sessionId);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 300000); // Clean every 5 minutes

// Mask IP address for privacy
function maskIp(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  return 'xxx.xxx.xxx.xxx';
}

// Get client IP from request
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

// POST /api/analytics/track - Log analytics event
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      sessionId,
      fileId,
      interactionType,
      timeSpent,
      deviceInfo,
      permission,
      viewerUserId,
      viewerEmail,
      metadata,
    } = body;

    // Validation
    if (!sessionId || !fileId) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, fileId' },
        { status: 400 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(sessionId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get client info
    const clientIp = getClientIp(request);
    const maskedIp = maskIp(clientIp);
    const userAgent = request.headers.get('user-agent') || '';

    // Parse device info from deviceInfo or user-agent
    const deviceType = deviceInfo?.deviceType || DeviceType.UNKNOWN;
    const browserName = deviceInfo?.browserName;
    const browserVersion = deviceInfo?.browserVersion;
    const operatingSystem = deviceInfo?.operatingSystem;
    const screenResolution = deviceInfo?.screenResolution;

    // Find or create analytics session
    let analyticsSession = await DocumentAnalytics.findOne({ sessionId });

    if (!analyticsSession) {
      // Create new session
      analyticsSession = new DocumentAnalytics({
        fileId: new mongoose.Types.ObjectId(fileId),
        sessionId,
        viewerUserId: viewerUserId ? new mongoose.Types.ObjectId(viewerUserId) : undefined,
        viewerEmail,
        viewerIp: maskedIp,
        deviceType,
        browserName,
        browserVersion,
        operatingSystem,
        screenResolution,
        permission: permission || 'full-access',
        interactions: [],
        firstViewedAt: new Date(),
        lastViewedAt: new Date(),
        totalTimeSpent: 0,
        isActiveSession: true,
      });

      // Add initial VIEW interaction
      analyticsSession.interactions.push({
        type: InteractionType.VIEW,
        timestamp: new Date(),
        metadata: { userAgent },
      });

      await analyticsSession.save();

      console.log(`[Analytics] ✅ New session created: ${sessionId} for file: ${fileId}`);

      return NextResponse.json({
        success: true,
        message: 'Session created and view logged',
        sessionId: analyticsSession.sessionId,
      });
    }

    // Update existing session
    if (interactionType) {
      // Add interaction
      analyticsSession.interactions.push({
        type: interactionType,
        timestamp: new Date(),
        metadata,
      });
      analyticsSession.lastViewedAt = new Date();
      await analyticsSession.save();
      console.log(`[Analytics] 📊 Interaction logged: ${interactionType} for session: ${sessionId}`);
    }

    if (timeSpent && timeSpent > 0) {
      // Update time spent (prevent unrealistic values)
      const validTimeSpent = Math.min(timeSpent, 3600); // Max 1 hour per update
      analyticsSession.totalTimeSpent += validTimeSpent;
      analyticsSession.lastViewedAt = new Date();
      await analyticsSession.save();
      console.log(`[Analytics] ⏱️ Time updated: +${validTimeSpent}s for session: ${sessionId}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Analytics updated',
    });
  } catch (error: any) {
    console.error('[Analytics Track] Error:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/analytics/track - Close session
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { sessionId, finalTimeSpent } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    const analyticsSession = await DocumentAnalytics.findOne({ sessionId });

    if (!analyticsSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update final time spent
    if (finalTimeSpent && finalTimeSpent > 0) {
      const validTimeSpent = Math.min(finalTimeSpent, 3600);
      analyticsSession.totalTimeSpent += validTimeSpent;
    }

    // Close session
    analyticsSession.isActiveSession = false;
    await analyticsSession.save();

    console.log(`[Analytics] 🔒 Session closed: ${sessionId}`);

    return NextResponse.json({
      success: true,
      message: 'Session closed',
    });
  } catch (error: any) {
    console.error('[Analytics Close Session] Error:', error);
    return NextResponse.json(
      { error: 'Failed to close session', details: error.message },
      { status: 500 }
    );
  }
}
