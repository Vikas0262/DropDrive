"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Eye,
  Users,
  Clock,
  MousePointerClick,
  Download,
  Shield,
  Copy,
  Printer,
  Camera,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import { AnalyticsData, DeviceType, InteractionType } from "@/types/analytics"
import { formatDuration, formatDate, formatDateTime } from "@/lib/utils/analyticsUtils"

interface AnalyticsViewProps {
  fileId: string
  userId: string
}

export function AnalyticsView({ fileId, userId }: AnalyticsViewProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/analytics/${fileId}?page=${page}&limit=20`, {
        headers: {
          'x-user-id': userId,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch analytics')
      }

      const result = await response.json()
      setData(result.data)
    } catch (err: any) {
      setError(err.message)
      console.error('[Analytics View] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (fileId && userId) {
      fetchAnalytics()
    }
  }, [fileId, userId, page])

  if (loading && !data) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  const { summary, sessions } = data
  
  // Ensure arrays are always defined
  const viewsByDevice = summary.viewsByDevice || []
  const topBrowsers = summary.topBrowsers || []
  const viewsByLocation = summary.viewsByLocation || []

  const getDeviceIcon = (deviceType: DeviceType) => {
    switch (deviceType) {
      case DeviceType.MOBILE:
        return <Smartphone className="h-4 w-4" />
      case DeviceType.TABLET:
        return <Tablet className="h-4 w-4" />
      case DeviceType.DESKTOP:
        return <Monitor className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4 opacity-50" />
    }
  }

  const getInteractionIcon = (type: InteractionType) => {
    switch (type) {
      case InteractionType.VIEW:
        return <Eye className="h-4 w-4" />
      case InteractionType.DOWNLOAD:
        return <Download className="h-4 w-4 text-green-500" />
      case InteractionType.DOWNLOAD_BLOCKED:
        return <Shield className="h-4 w-4 text-red-500" />
      case InteractionType.SCREENSHOT_ATTEMPT:
        return <Camera className="h-4 w-4 text-orange-500" />
      case InteractionType.COPY_ATTEMPT:
        return <Copy className="h-4 w-4 text-orange-500" />
      case InteractionType.PRINT_ATTEMPT:
        return <Printer className="h-4 w-4 text-orange-500" />
      default:
        return <MousePointerClick className="h-4 w-4" />
    }
  }

  const formatInteractionType = (type: InteractionType) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Analytics</h2>
          <p className="text-sm text-muted-foreground">Track views and interactions</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalViews}</div>
            <p className="text-xs text-muted-foreground">All viewing sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Viewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.uniqueViewers}</div>
            <p className="text-xs text-muted-foreground">Distinct users/IPs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(summary.averageTimeSpent)}</div>
            <p className="text-xs text-muted-foreground">Per viewing session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(summary.interactionCounts).reduce((a, b) => a + b, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total actions logged</p>
          </CardContent>
        </Card>
      </div>

      {/* User Clicks Bar Graph */}
      <Card>
        <CardHeader>
          <CardTitle>User Clicks</CardTitle>
          <CardDescription>Number of interactions per session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessions.length > 0 ? (
              sessions.map((session, index) => {
                const clickCount = session.interactions.length;
                const maxClicks = Math.max(...sessions.map(s => s.interactions.length), 1);
                const barWidth = (clickCount / maxClicks) * 100;
                
                return (
                  <div key={session._id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Session {index + 1}</span>
                      <Badge variant="secondary">{clickCount} clicks</Badge>
                    </div>
                    <div className="h-8 bg-muted rounded-md overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300" 
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No click data available yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="interactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
        </TabsList>

        {/* Interactions Tab */}
        <TabsContent value="interactions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Interactions Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Interactions Breakdown</CardTitle>
                <CardDescription>Types of actions performed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(summary.interactionCounts).map(([type, count]) => (
                  count > 0 && (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getInteractionIcon(type as InteractionType)}
                        <span className="text-sm">{formatInteractionType(type as InteractionType)}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  )
                ))}
                {Object.values(summary.interactionCounts).every(count => count === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No interactions yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
                <CardDescription>Views by device category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {viewsByDevice.map((item) => (
                  <div key={item.deviceType} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(item.deviceType)}
                      <span className="text-sm capitalize">{item.deviceType}</span>
                    </div>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
                {viewsByDevice.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No device data yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Browser Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Top Browsers</CardTitle>
                <CardDescription>Most used web browsers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topBrowsers.map((item) => (
                  <div key={item.browserName} className="flex items-center justify-between">
                    <span className="text-sm">{item.browserName}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
                {topBrowsers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No browser data yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Location Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
                <CardDescription>Views by country</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {viewsByLocation.map((item) => (
                  <div key={item.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="text-sm">{item.country}</span>
                    </div>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
                {viewsByLocation.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No location data available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>Blocked actions and security alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Security Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Camera className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Screenshot Attempts</p>
                      <p className="text-2xl font-bold">{summary.interactionCounts.screenshot_attempt || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Shield className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Downloads Blocked</p>
                      <p className="text-2xl font-bold">{summary.interactionCounts.download_blocked || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Copy className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Copy Attempts</p>
                      <p className="text-2xl font-bold">{summary.interactionCounts.copy_attempt || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Security Events */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Recent Security Events</h4>
                  {sessions
                    .flatMap(session => 
                      session.interactions
                        .filter(interaction => 
                          [
                            InteractionType.SCREENSHOT_ATTEMPT,
                            InteractionType.DOWNLOAD_BLOCKED,
                            InteractionType.COPY_ATTEMPT,
                            InteractionType.PRINT_ATTEMPT,
                          ].includes(interaction.type)
                        )
                        .map(interaction => ({
                          ...interaction,
                          sessionDevice: session.deviceType,
                          sessionBrowser: session.browserName,
                        }))
                    )
                    .slice(0, 10)
                    .map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getInteractionIcon(event.type)}
                          <div>
                            <p className="text-sm font-medium">{formatInteractionType(event.type)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(event.timestamp)} • {event.sessionDevice} • {event.sessionBrowser}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-orange-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Blocked
                        </Badge>
                      </div>
                    ))}
                  {sessions.every(s => s.interactions.every(i => 
                    ![
                      InteractionType.SCREENSHOT_ATTEMPT,
                      InteractionType.DOWNLOAD_BLOCKED,
                      InteractionType.COPY_ATTEMPT,
                      InteractionType.PRINT_ATTEMPT,
                    ].includes(i.type)
                  )) && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No security events recorded
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
