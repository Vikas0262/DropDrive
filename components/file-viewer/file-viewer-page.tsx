"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Download,
  Share2,
  Star,
  MoreHorizontal,
  Eye,
  FileText,
  ImageIcon,
  Video,
  Music,
  Archive,
  Code,
  Users,
  Globe,
  Copy,
  X,
  Sun,
  Moon,
  Bell,
  User,
  Settings,
  LogOut,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react"
import { useTheme } from "next-themes"
import { getSessionUser } from "@/lib/auth/session"
import { ShareModal } from "./share-modal"
import Link from "next/link"

// Utility function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Sample file data (in a real app, this would come from an API)
const files = [
  {
    id: 1,
    name: "Project Proposal.pdf",
    type: "pdf",
    size: "2.4 MB",
    modified: "2 hours ago",
    created: "March 15, 2024",
    starred: true,
    shared: false,
    icon: "📄",
    owner: "John Doe",
    description: "Comprehensive project proposal for Q2 2024 initiatives including budget allocation and timeline.",
    tags: ["proposal", "q2", "budget"],
    sharedWith: [],
    publicLink: null,
    downloadCount: 12,
    viewCount: 45,
  },
  {
    id: 2,
    name: "Design Assets",
    type: "folder",
    size: "12 items",
    modified: "1 day ago",
    created: "March 10, 2024",
    starred: false,
    shared: true,
    icon: "📁",
    owner: "John Doe",
    description: "Collection of design assets including logos, icons, and brand guidelines.",
    tags: ["design", "assets", "branding"],
    sharedWith: ["jane@example.com", "mike@example.com"],
    publicLink: "https://dropdrive.com/share/abc123",
    downloadCount: 8,
    viewCount: 23,
  },
  {
    id: 3,
    name: "Meeting Recording.mp4",
    type: "video",
    size: "156 MB",
    modified: "3 days ago",
    created: "March 12, 2024",
    starred: false,
    shared: false,
    icon: "🎥",
    owner: "John Doe",
    description: "Weekly team meeting recording discussing project milestones and deliverables.",
    tags: ["meeting", "team", "recording"],
    sharedWith: [],
    publicLink: null,
    downloadCount: 3,
    viewCount: 15,
  },
]

function VideoPlayer({ fileUrl, fileName }: { fileUrl: string; fileName: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      if (newVolume > 0 && isMuted) {
        videoRef.current.muted = false
        setIsMuted(false)
      }
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleFullscreen = async () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
    }
  }

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full bg-black rounded-lg overflow-hidden group relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={fileUrl}
        className="w-full h-auto max-h-96 cursor-pointer"
        onClick={handlePlayPause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleDurationChange}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Play Button Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
          <button
            onClick={handlePlayPause}
            className="bg-white/80 hover:bg-white rounded-full p-4 transition-all transform hover:scale-110"
          >
            <Play className="h-8 w-8 text-black fill-black" />
          </button>
        </div>
      )}

      {/* Video Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-3 flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="flex-1 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            style={{
              background: `linear-gradient(to right, white 0%, white ${
                (currentTime / duration) * 100
              }%, rgb(75 85 99) ${(currentTime / duration) * 100}%, rgb(75 85 99) 100%)`,
            }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-white" />
              ) : (
                <Play className="h-4 w-4 fill-white" />
              )}
            </Button>

            {/* Volume Control */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={handleMuteToggle}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-16 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary hidden sm:block"
              />
            </div>

            {/* Time Display */}
            <div className="text-white text-xs font-medium ml-2 hidden sm:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Fullscreen Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={handleFullscreen}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface FileViewerPageProps {
  fileId: string | null
  onNavigate: (page: "dashboard" | "profile" | "file-viewer") => void
  onLogout: () => void
}

function FilePreview({ file }: { file: any }) {
  const getFileIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes("pdf")) return <FileText className="h-16 w-16 text-destructive" />
    if (lowerType.includes("image")) return <ImageIcon className="h-16 w-16 text-success" />
    if (lowerType.includes("video")) return <Video className="h-16 w-16 text-primary" />
    if (lowerType.includes("audio")) return <Music className="h-16 w-16 text-info" />
    if (lowerType.includes("zip") || lowerType.includes("rar") || lowerType.includes("7z")) {
      return <Archive className="h-16 w-16 text-orange-500" />
    }
    if (
      lowerType.includes("code") ||
      lowerType.includes("javascript") ||
      lowerType.includes("typescript") ||
      lowerType.includes("json")
    ) {
      return <Code className="h-16 w-16 text-muted-foreground" />
    }
    return <FileText className="h-16 w-16 text-muted-foreground" />
  }

  const fileType = file.fileType?.toLowerCase() || "file"

  if (fileType.includes("pdf")) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4">
          {getFileIcon(fileType)}
          <div>
            <p className="font-medium">PDF Preview</p>
            <p className="text-sm text-muted-foreground">Click download to view the full document</p>
          </div>
        </div>
      </div>
    )
  }

  if (fileType.includes("video")) {
    return <VideoPlayer fileUrl={file.fileUrl} fileName={file.fileName} />
  }

  if (fileType.includes("image")) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
        <img
          src={file.fileUrl}
          alt={file.fileName}
          className="max-h-96 max-w-full object-contain"
          onError={(e) => {
            e.currentTarget.src = ""
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
      <div className="text-center space-y-4">
        {getFileIcon(fileType)}
        <div>
          <p className="font-medium">File Preview</p>
          <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
        </div>
      </div>
    </div>
  )
}

function TopNavigation({
  onNavigate,
  onLogout,
}: { onNavigate: (page: "dashboard" | "profile") => void; onLogout: () => void }) {
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const userData = getSessionUser()
    if (userData) {
      setUser(userData)
      if (userData._id) {
        fetchProfilePicture(userData._id)
      }
    }

    const handleStorageChange = () => {
      const updatedUserData = getSessionUser()
      if (updatedUserData) {
        setUser(updatedUserData)
        if (updatedUserData._id) {
          fetchProfilePicture(updatedUserData._id)
        }
      }
    }

    const handleUserUpdate = () => {
      const updatedUserData = getSessionUser()
      if (updatedUserData) {
        setUser(updatedUserData)
        if (updatedUserData._id) {
          fetchProfilePicture(updatedUserData._id)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("userUpdated", handleUserUpdate)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("userUpdated", handleUserUpdate)
    }
  }, [])

  const fetchProfilePicture = async (userId: string) => {
    try {
      const response = await fetch(`/api/auth/profile?userId=${userId}&includeImage=true`)
      const data = await response.json()
      if (data.user?.profilePicture) {
        setProfilePicture(data.user.profilePicture)
      }
    } catch (error) {
      console.error("Failed to fetch profile picture:", error)
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U"
    const first = firstName?.[0]?.toUpperCase() || ""
    const last = lastName?.[0]?.toUpperCase() || ""
    return (first + last).slice(0, 2)
  }

  if (!mounted) {
    return (
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4 px-4 md:px-6">
          <div className="flex items-center gap-0">
          <Link href="/" className="flex items-center gap-0">
          <div className="relative h-12 w-12 flex-shrink-0 rounded-full overflow-hidden pt-1.5">
            <img
              src="/logoicon.png"
              alt="DropDrive Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="font-semibold text-lg">DropDrive</span>
        </Link>
        </div>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-0">
          <div className="relative h-12 w-12 flex-shrink-0 rounded-full overflow-hidden pt-1.5">
            <img
              src="/logoicon.png"
              alt="DropDrive Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="font-semibold text-lg">DropDrive</span>
        </Link>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 md:h-9 md:w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 hidden sm:flex">
            <Bell className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 md:h-9 md:w-9 rounded-full">
                <Avatar className="h-7 w-7 md:h-8 md:w-8">
                  <AvatarImage src={profilePicture || undefined} alt={user?.firstName || "User"} />
                  <AvatarFallback>{getInitials(user?.firstName, user?.lastName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate("profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export function FileViewerPage({ fileId, onNavigate, onLogout }: FileViewerPageProps) {
  const [file, setFile] = useState<any>(null)
  const [isStarred, setIsStarred] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const user = getSessionUser()

  useEffect(() => {
    const fetchFile = async () => {
      if (!fileId) {
        setError("No file ID provided")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/files/${fileId}`)
        if (!response.ok) {
          throw new Error("File not found")
        }
        const data = await response.json()
        setFile(data)
        setIsStarred(data.starred || false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file")
      } finally {
        setLoading(false)
      }
    }

    fetchFile()
  }, [fileId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading file...</p>
        </div>
      </div>
    )
  }

  if (error || !file) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">File not found</h2>
          <p className="text-muted-foreground mb-4">{error || "The file you're looking for doesn't exist."}</p>
          <Button onClick={() => onNavigate("dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  const handleStarToggle = async () => {
    try {
      await fetch("/api/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "star",
          fileId: fileId,
          value: !isStarred,
        }),
      })
      setIsStarred(!isStarred)
    } catch (err) {
      console.error("Failed to toggle star:", err)
    }
  }

  const handleDownload = async () => {
    if (file.fileUrl) {
      window.open(file.fileUrl, "_blank")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onNavigate={onNavigate} onLogout={onLogout} />

      <div className="container max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold truncate">{file.fileName}</h1>
            <p className="text-muted-foreground">
              {file.fileSize} • Modified {new Date(file.lastModified || file.uploadTime).toLocaleDateString()} • Created {new Date(file.uploadTime).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Preview */}
            <Card>
              <CardContent className="p-6">
                <FilePreview file={file} />
              </CardContent>
            </Card>

            {/* File Actions */}
            <div className="flex flex-wrap gap-2">
              <Button className="gap-2" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setShowShareModal(true)}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="icon" onClick={handleStarToggle}>
                <Star className={`h-4 w-4 ${isStarred ? "fill-warning text-warning" : ""}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                  }}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Rename</DropdownMenuItem>
                  <DropdownMenuItem>Move</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* File Info */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">File Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="secondary">{file.fileType.toUpperCase()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span>{typeof file.fileSize === 'number' ? formatFileSize(file.fileSize) : file.fileSize}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Owner</span>
                    <span>{file.owner || user?.firstName + ' ' + user?.lastName || 'You'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Uploaded</span>
                    <span>{new Date(file.uploadTime).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sharing Info */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Sharing</h3>

                {file.sharedWith && file.sharedWith.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-info" />
                      <span>Shared with {file.sharedWith.length} people</span>
                    </div>
                    <ScrollArea className="h-20">
                      <div className="space-y-1">
                        {file.sharedWith.map((sharedUser: any, idx: number) => {
                          const email = typeof sharedUser === 'string' ? sharedUser : (sharedUser.email || sharedUser.userEmail)
                          const userName = typeof sharedUser === 'string' ? email.split('@')[0] : (sharedUser.name || sharedUser.userName || email.split('@')[0])
                          return (
                            <div key={idx} className="text-xs">
                              <div className="font-medium text-foreground">{userName}</div>
                              <div className="text-muted-foreground">{email}</div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span>Not shared</span>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full gap-2 bg-transparent"
                  onClick={() => setShowShareModal(true)}
                >
                  <Share2 className="h-4 w-4" />
                  Manage Sharing
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} file={file} />
    </div>
  )
}
