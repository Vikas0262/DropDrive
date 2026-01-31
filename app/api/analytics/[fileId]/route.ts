import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import DocumentAnalytics from '@/models/DocumentAnalytics';
import File from '@/models/File';
import { AnalyticsSummary, DeviceType } from '@/types/analytics';
import mongoose from 'mongoose';

// GET /api/analytics/[fileId] - Get analytics for a specific file
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    await dbConnect();

    const { fileId } = params;
    const { searchParams } = new URL(request.url);
    const userId = request.headers.get('x-user-id');
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Validate fileId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return NextResponse.json(
        { error: 'Invalid file ID' },
        { status: 400 }
      );
    }

    // Check if user owns the file
    const file = await File.findById(fileId);
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Authorization: Only file owner can view analytics
    if (file.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this file' },
        { status: 403 }
      );
    }

    console.log(`[Analytics Fetch] 📊 Fetching analytics for file: ${fileId}`);

    // Get summary statistics
    const totalViews = await DocumentAnalytics.countDocuments({
      fileId: new mongoose.Types.ObjectId(fileId),
    });

    const uniqueViewers = await DocumentAnalytics.aggregate([
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
      { $count: 'count' },
    ]);

    const avgTimeResult = await DocumentAnalytics.aggregate([
      { $match: { fileId: new mongoose.Types.ObjectId(fileId) } },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$totalTimeSpent' },
        },
      },
    ]);

    // Get interaction counts
    const interactionCounts = await DocumentAnalytics.aggregate([
      { $match: { fileId: new mongoose.Types.ObjectId(fileId) } },
      { $unwind: '$interactions' },
      {
        $group: {
          _id: '$interactions.type',
          count: { $sum: 1 },
        },
      },
    ]);

    const interactionCountsMap: any = {
      view: 0,
      download: 0,
      download_blocked: 0,
      screenshot_attempt: 0,
      copy_attempt: 0,
      print_attempt: 0,
    };
    interactionCounts.forEach((item) => {
      interactionCountsMap[item._id] = item.count;
    });

    // Views by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const viewsByDate = await DocumentAnalytics.aggregate([
      {
        $match: {
          fileId: new mongoose.Types.ObjectId(fileId),
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
    ]);

    // Views by device
    const viewsByDevice = await DocumentAnalytics.aggregate([
      { $match: { fileId: new mongoose.Types.ObjectId(fileId) } },
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          deviceType: '$_id',
          count: 1,
        },
      },
    ]);

    // Views by location (country)
    const viewsByLocation = await DocumentAnalytics.aggregate([
      {
        $match: {
          fileId: new mongoose.Types.ObjectId(fileId),
          'viewerLocation.country': { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$viewerLocation.country',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          country: '$_id',
          count: 1,
        },
      },
    ]);

    // Top browsers
    const topBrowsers = await DocumentAnalytics.aggregate([
      {
        $match: {
          fileId: new mongoose.Types.ObjectId(fileId),
          browserName: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$browserName',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          browserName: '$_id',
          count: 1,
        },
      },
    ]);

    const summary: AnalyticsSummary = {
      totalViews,
      uniqueViewers: uniqueViewers[0]?.count || 0,
      averageTimeSpent: Math.round(avgTimeResult[0]?.avgTime || 0),
      interactionCounts: interactionCountsMap,
      viewsByDate,
      viewsByDevice,
      viewsByLocation,
      topBrowsers,
    };

    // Get paginated session details
    const sessions = await DocumentAnalytics.find({
      fileId: new mongoose.Types.ObjectId(fileId),
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await DocumentAnalytics.countDocuments({
      fileId: new mongoose.Types.ObjectId(fileId),
    });

    console.log(`[Analytics Fetch] ✅ Retrieved ${sessions.length} sessions`);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        sessions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + sessions.length < total,
        },
      },
    });
  } catch (error: any) {
    console.error('[Analytics Fetch] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    );
  }
}
