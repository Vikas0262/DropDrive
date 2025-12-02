"use client"

import * as React from "react"
import {
  Search,
  Upload,
  Grid3X3,
  List,
  MoreHorizontal,
  Star,
  Trash2,
  Clock,
  Users,
  HardDrive,
  Sun,
  Moon,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { getSessionUser } from "@/lib/auth/session"

// Sample file data
const files = [
  {
    id: 1,
    name: "Project Proposal.pdf",
    type: "pdf",
    size: "2.4 MB",
    modified: "2 hours ago",
    starred: true,
    shared: false,
    icon: "📄",
  },
  {
    id: 2,
    name: "Design Assets",
    type: "folder",
    size: "12 items",
    modified: "1 day ago",
    starred: false,
    shared: true,
    icon: "📁",
  },
  {
    id: 3,
    name: "Meeting Recording.mp4",
    type: "video",
    size: "156 MB",
    modified: "3 days ago",
    starred: false,
    shared: false,
    icon: "🎥",
  },
  {
    id: 4,
    name: "Budget Spreadsheet.xlsx",
    type: "spreadsheet",
    size: "1.2 MB",
    modified: "1 week ago",
    starred: true,
    shared: true,
    icon: "📊",
  },
  {
    id: 5,
    name: "Team Photos",
    type: "folder",
    size: "24 items",
    modified: "2 weeks ago",
    starred: false,
    shared: false,
    icon: "📁",
  },
  {
    id: 6,
    name: "Presentation.pptx",
    type: "presentation",
    size: "8.7 MB",
    modified: "3 weeks ago",
    starred: false,
    shared: true,
    icon: "📊",
  },
]

const sidebarItems = [
  {
    title: "My Drive",
    icon: HardDrive,
    url: "#",
    isActive: true,
  },
  {
    title: "Shared with me",
    icon: Users,
    url: "#",
    badge: "3",
  },
  {
    title: "Recent",
    icon: Clock,
    url: "#",
  },
  {
    title: "Starred",
    icon: Star,
    url: "#",
  },
  {
    title: "Trash",
    icon: Trash2,
    url: "#",
  },
]

interface FileManagerProps {
  onNavigate: (page: "profile" | "dashboard") => void
  onLogout: () => void
  onFileView: (fileId: number) => void
}

function MobileSidebar({ onNavigate, onLogout }: FileManagerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          <div className="border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 text-white font-bold text-sm">
                DD
              </div>
              <span className="font-semibold text-lg">DropDrive</span>
            </div>
          </div>

          <div className="flex-1 px-4 py-4">
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.title}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent/50 transition-colors ${
                    item.isActive ? "bg-accent text-accent-foreground" : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t px-4 py-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Storage</span>
                  <span className="text-xs">2.1 GB of 15 GB</span>
                </div>
                <Progress value={14} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DesktopSidebar() {
  return (
    <div className="hidden md:flex w-64 flex-col border-r bg-background">
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 text-white font-bold text-sm">
            DD
          </div>
          <span className="font-semibold text-lg">DropDrive</span>
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        <div className="space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.title}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent/50 transition-colors ${
                item.isActive ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t px-4 py-4">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Storage</span>
              <span className="text-xs">2.1 GB of 15 GB</span>
            </div>
            <Progress value={14} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  )
}

function TopNavigation({ onNavigate, onLogout }: FileManagerProps) {
  const { theme, setTheme } = useTheme()
  const [user, setUser] = React.useState<any>(null)
  const [profilePicture, setProfilePicture] = React.useState<string | null>(null)

  React.useEffect(() => {
    const userData = getSessionUser()
    if (userData) {
      setUser(userData)
      // Fetch profile picture separately
      if (userData._id) {
        fetchProfilePicture(userData._id)
      }
    }

    // Listen for storage changes
    const handleStorageChange = () => {
      const updatedUserData = getSessionUser()
      if (updatedUserData) {
        setUser(updatedUserData)
        if (updatedUserData._id) {
          fetchProfilePicture(updatedUserData._id)
        }
      }
    }

    // Listen for custom event (for same-tab updates)
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
      console.error('Failed to fetch profile picture:', error)
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U"
    const first = firstName?.[0]?.toUpperCase() || ""
    const last = lastName?.[0]?.toUpperCase() || ""
    return (first + last).slice(0, 2)
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4 px-4 md:px-6">
        <MobileSidebar onNavigate={onNavigate} onLogout={onLogout} />

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search in DropDrive"
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-ring h-9 md:h-10"
            />
          </div>
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

          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
            <Bell className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 md:h-9 md:w-9 rounded-full">
                <Avatar className="h-7 w-7 md:h-8 md:w-8 bg-gradient-to-br from-blue-500 to-teal-500">
                  {profilePicture && (
                    <AvatarImage src={profilePicture} alt={user?.firstName} />
                  )}
                  <AvatarFallback className="text-white font-semibold text-sm">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
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

function FileCard({
  file,
  viewMode,
  onFileView,
}: { file: (typeof files)[0]; viewMode: "grid" | "list"; onFileView: (fileId: number) => void }) {
  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer"
        onClick={() => onFileView(file.id)}
      >
        <div className="text-xl md:text-2xl">{file.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm md:text-base">{file.name}</p>
        </div>
        <div className="hidden sm:block text-xs md:text-sm text-muted-foreground w-16 md:w-20">{file.size}</div>
        <div className="hidden lg:block text-xs md:text-sm text-muted-foreground w-20 md:w-24">{file.modified}</div>
        <div className="flex items-center gap-1">
          {file.starred && <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />}
          {file.shared && <Users className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 md:h-8 md:w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onFileView(file.id)}>View</DropdownMenuItem>
              <DropdownMenuItem>Download</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  return (
    <Card
      className="group hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer"
      onClick={() => onFileView(file.id)}
    >
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start justify-between mb-2 md:mb-3">
          <div className="text-2xl md:text-3xl">{file.icon}</div>
          <div className="flex items-center gap-1">
            {file.starred && <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />}
            {file.shared && <Users className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 md:h-8 md:w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onFileView(file.id)}>View</DropdownMenuItem>
                <DropdownMenuItem>Download</DropdownMenuItem>
                <DropdownMenuItem>Share</DropdownMenuItem>
                <DropdownMenuItem>Rename</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-medium text-xs md:text-sm truncate" title={file.name}>
            {file.name}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{file.size}</span>
            <span className="hidden sm:block">{file.modified}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MainContent({ onFileView }: { onFileView: (fileId: number) => void }) {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-6 border-b">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">My Drive</h1>
          <p className="text-muted-foreground text-sm md:text-base">Manage your files and folders</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-7 md:h-8 px-2 md:px-3"
            >
              <Grid3X3 className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-7 md:h-8 px-2 md:px-3"
            >
              <List className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
          <Button className="gap-2 h-8 md:h-10 px-3 md:px-4 text-sm">
            <Upload className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 overflow-auto">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
            {files.map((file) => (
              <FileCard key={file.id} file={file} viewMode={viewMode} onFileView={onFileView} />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="hidden md:flex items-center gap-4 p-3 text-sm font-medium text-muted-foreground border-b">
              <div className="w-8"></div>
              <div className="flex-1">Name</div>
              <div className="w-20">Size</div>
              <div className="w-24">Modified</div>
              <div className="w-12"></div>
            </div>
            {files.map((file) => (
              <FileCard key={file.id} file={file} viewMode={viewMode} onFileView={onFileView} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function FileManager({ onNavigate, onLogout, onFileView }: FileManagerProps) {
  return (
    <div className="flex h-screen bg-background">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavigation onNavigate={onNavigate} onLogout={onLogout} />
        <MainContent onFileView={onFileView} />
      </div>
    </div>
  )
}
