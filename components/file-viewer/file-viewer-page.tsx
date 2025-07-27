"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { useTheme } from "next-themes"
import { ShareModal } from "./share-modal"

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

interface FileViewerPageProps {
  fileId: number | null
  onNavigate: (page: "dashboard" | "profile" | "file-viewer") => void
  onLogout: () => void
}

function FilePreview({ file }: { file: any }) {
  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-16 w-16 text-red-500" />
      case "image":
        return <ImageIcon className="h-16 w-16 text-green-500" />
      case "video":
        return <Video className="h-16 w-16 text-purple-500" />
      case "audio":
        return <Music className="h-16 w-16 text-blue-500" />
      case "archive":
        return <Archive className="h-16 w-16 text-orange-500" />
      case "code":
        return <Code className="h-16 w-16 text-gray-500" />
      case "folder":
        return <div className="text-6xl">📁</div>
      default:
        return <FileText className="h-16 w-16 text-gray-500" />
    }
  }

  if (file.type === "pdf") {
    return (
      <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4">
          {getFileIcon(file.type)}
          <div>
            <p className="font-medium">PDF Preview</p>
            <p className="text-sm text-muted-foreground">Click download to view the full document</p>
          </div>
        </div>
      </div>
    )
  }

  if (file.type === "video") {
    return (
      <div className="w-full h-96 bg-black rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4 text-white">
          {getFileIcon(file.type)}
          <div>
            <p className="font-medium">Video Preview</p>
            <p className="text-sm opacity-70">Click to play video</p>
          </div>
        </div>
      </div>
    )
  }

  if (file.type === "folder") {
    return (
      <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">📁</div>
          <div>
            <p className="font-medium">Folder Contents</p>
            <p className="text-sm text-muted-foreground">{file.size}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-96 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-4">
        {getFileIcon(file.type)}
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

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 text-white font-bold text-sm">
            DD
          </div>
          <span className="font-semibold text-lg hidden sm:block">DropDrive</span>
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
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">John Doe</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">john.doe@example.com</p>
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

  useEffect(() => {
    // In a real app, you'd fetch the file data from an API
    const foundFile = files.find((f) => f.id === fileId)
    if (foundFile) {
      setFile(foundFile)
      setIsStarred(foundFile.starred)
    }
  }, [fileId])

  if (!file) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">File not found</h2>
          <p className="text-muted-foreground mb-4">The file you're looking for doesn't exist.</p>
          <Button onClick={() => onNavigate("dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  const handleStarToggle = () => {
    setIsStarred(!isStarred)
    // In a real app, you'd update this on the server
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
            <h1 className="text-2xl md:text-3xl font-semibold truncate">{file.name}</h1>
            <p className="text-muted-foreground">
              {file.size} • Modified {file.modified} • Created {file.created}
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
              <Button className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setShowShareModal(true)}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="icon" onClick={handleStarToggle}>
                <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-400 text-yellow-400" : ""}`} />
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
                  <DropdownMenuItem>
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

            {/* Description */}
            {file.description && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{file.description}</p>
                </CardContent>
              </Card>
            )}
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
                    <Badge variant="secondary">{file.type.toUpperCase()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span>{file.size}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Owner</span>
                    <span>{file.owner}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Views</span>
                    <span>{file.viewCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Downloads</span>
                    <span>{file.downloadCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {file.tags && file.tags.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {file.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sharing Info */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Sharing</h3>

                {file.publicLink ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-green-500" />
                      <span>Public link active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted p-2 rounded truncate">{file.publicLink}</code>
                      <Button size="icon" variant="outline" className="h-8 w-8 bg-transparent">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span>Not publicly shared</span>
                  </div>
                )}

                {file.sharedWith && file.sharedWith.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>Shared with {file.sharedWith.length} people</span>
                    </div>
                    <ScrollArea className="h-20">
                      <div className="space-y-1">
                        {file.sharedWith.map((email: string) => (
                          <div key={email} className="text-xs text-muted-foreground">
                            {email}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
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

            {/* Activity */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Recent Activity</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p>File viewed by you</p>
                      <p className="text-muted-foreground text-xs">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p>File uploaded</p>
                      <p className="text-muted-foreground text-xs">{file.created}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} file={file} />
    </div>
  )
}
