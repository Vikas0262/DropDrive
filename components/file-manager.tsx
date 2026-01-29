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
  Download,
  Edit,
  RotateCcw,
  Trash,
  FolderPlus,
  Folder,
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTheme } from "next-themes"
import { getSessionUser } from "@/lib/auth/session"
import { useFileManager, type FilterType, type FileItem, type UploadingFile } from "@/hooks/useFileManager"
import Link from "next/link"

// Helper function to get file icon based on type
function getFileIcon(fileType: string): string {
  const iconMap: Record<string, string> = {
    pdf: "📄",
    document: "📝",
    spreadsheet: "📊",
    presentation: "📊",
    image: "🖼️",
    video: "🎥",
    audio: "🎵",
    archive: "📦",
    text: "📄",
    folder: "📁",
  }
  return iconMap[fileType] || "📄"
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`
  return new Date(date).toLocaleDateString()
}

const sidebarItems: Array<{
  title: string
  icon: React.ComponentType<{ className?: string }>
  filter: FilterType
}> = [
  {
    title: "My Drive",
    icon: HardDrive,
    filter: "my-drive",
  },
  {
    title: "Shared with me",
    icon: Users,
    filter: "shared",
  },
  {
    title: "Recent",
    icon: Clock,
    filter: "recent",
  },
  {
    title: "Starred",
    icon: Star,
    filter: "starred",
  },
  {
    title: "Trash",
    icon: Trash2,
    filter: "trash",
  },
]

interface FileManagerProps {
  onNavigate: (page: "profile" | "dashboard") => void
  onLogout: () => void
  onFileView: (fileId: string) => void
}

function MobileSidebar({
  onNavigate,
  onLogout,
  filter,
  onFilterChange,
  sharedCount,
  totalStorageUsed = 0,
}: FileManagerProps & { filter: FilterType; onFilterChange: (f: FilterType) => void; sharedCount: number; totalStorageUsed?: number }) {
  const [open, setOpen] = React.useState(false)
  const MAX_STORAGE = 1 * 1024 * 1024 * 1024 // 1 GB in bytes
  const storagePercentage = Math.min((totalStorageUsed / MAX_STORAGE) * 100, 100)

  const formatStorageSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

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
            <div className="flex items-center gap-0">
          <div className="relative h-12 w-12 flex-shrink-0 rounded-full overflow-hidden pt-1.2">
            <img
              src="/logoicon.png"
              alt="DropDrive Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="font-semibold text-lg">DropDrive</span>
        </div>
          </div>

          <div className="flex-1 px-4 py-4">
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.filter}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent/50 transition-colors ${
                    filter === item.filter ? "bg-accent text-accent-foreground" : ""
                  }`}
                  onClick={() => {
                    onFilterChange(item.filter)
                    setOpen(false)
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1">{item.title}</span>
                  {item.filter === "shared" && sharedCount > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {sharedCount}
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
                  <span className="text-xs">{formatStorageSize(totalStorageUsed)} of {formatStorageSize(MAX_STORAGE)}</span>
                </div>
                <Progress value={storagePercentage} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DesktopSidebar({
  filter,
  onFilterChange,
  sharedCount,
  totalStorageUsed = 0,
}: {
  filter: FilterType
  onFilterChange: (f: FilterType) => void
  sharedCount: number
  totalStorageUsed?: number
}) {
  const MAX_STORAGE = 1 * 1024 * 1024 * 1024 // 1 GB in bytes
  const storagePercentage = Math.min((totalStorageUsed / MAX_STORAGE) * 100, 100)

  const formatStorageSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="hidden md:flex w-64 flex-col border-r bg-background">
      {/* <div className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            DD
          </div>
          <span className="font-semibold text-lg">DropDrive</span>
        </div>
      </div> */}

       <div className="border-b px-6 py-2">
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
      
        

      <div className="flex-1 px-4 py-4">
        <div className="space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.filter}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent/50 transition-colors ${
                filter === item.filter ? "bg-accent text-accent-foreground" : ""
              }`}
              onClick={() => onFilterChange(item.filter)}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.title}</span>
              {item.filter === "shared" && sharedCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {sharedCount}
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
              <span className="text-xs">{formatStorageSize(totalStorageUsed)} of {formatStorageSize(MAX_STORAGE)}</span>
            </div>
            <Progress value={storagePercentage} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  )
}

function TopNavigation({ 
  onNavigate, 
  onLogout, 
  filter = "my-drive",
  onFilterChange = () => {},
  sharedCount = 0,
  totalStorageUsed = 0,
  searchQuery = "",
  onSearchChange = () => {},
}: FileManagerProps & { 
  filter?: FilterType
  onFilterChange?: (f: FilterType) => void
  sharedCount?: number
  totalStorageUsed?: number
  searchQuery?: string
  onSearchChange?: (query: string) => void
}) {
  const { theme, setTheme } = useTheme()
  const [user, setUser] = React.useState<any>(null)
  const [profilePicture, setProfilePicture] = React.useState<string | null>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
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
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50" suppressHydrationWarning>
        <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4 px-4 md:px-6">
          <Button variant="ghost" size="icon" className="md:hidden h-5 w-5" disabled>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50" suppressHydrationWarning>
      <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4 px-4 md:px-6">
        <MobileSidebar 
          onNavigate={onNavigate} 
          onLogout={onLogout} 
          onFileView={() => {}} 
          filter={filter} 
          onFilterChange={onFilterChange} 
          sharedCount={sharedCount}
          totalStorageUsed={totalStorageUsed}
        />

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search in DropDrive"
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-ring h-9 md:h-10"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
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
                <Avatar className="h-7 w-7 md:h-8 md:w-8 bg-primary">
                  {profilePicture && <AvatarImage src={profilePicture} alt={user?.firstName} />}
                  <AvatarFallback className="text-white font-semibold text-sm">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
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

function RenameDialog({
  open,
  file,
  onOpenChange,
  onRename,
}: {
  open: boolean
  file: FileItem | null
  onOpenChange: (open: boolean) => void
  onRename: (newName: string) => Promise<any>
}) {
  const [newName, setNewName] = React.useState("")

  React.useEffect(() => {
    if (file) {
      setNewName(file.fileName)
    }
  }, [file])

  const handleRenameClick = async () => {
    if (newName.trim()) {
      await onRename(newName)
      setNewName("")
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rename File</AlertDialogTitle>
          <AlertDialogDescription>Enter the new name for your file</AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New file name"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleRenameClick()
            }
          }}
        />
        <div className="flex justify-end gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRenameClick}
          >
            Rename
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function CreateFolderDialog({
  open,
  onOpenChange,
  onCreateFolder,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateFolder: (folderName: string) => void
}) {
  const [folderName, setFolderName] = React.useState("")

  const handleCreate = () => {
    if (folderName.trim()) {
      onCreateFolder(folderName)
      setFolderName("")
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create New Folder</AlertDialogTitle>
          <AlertDialogDescription>Enter a name for the new folder</AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder="Folder name"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCreate()
            }
          }}
        />
        <div className="flex justify-end gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleCreate}>
            Create
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function FileCard({
  file,
  viewMode,
  onFileView,
  onToggleStar,
  onDelete,
  onRename,
  onDownload,
  onRestore,
  onPermanentDelete,
  filter,
  onEnterFolder,
}: {
  file: FileItem
  viewMode: "grid" | "list"
  onFileView: (fileId: string) => void
  onToggleStar: (fileId: string) => void
  onDelete: (fileId: string) => void
  onRename: (file: FileItem) => void
  onDownload: (file: FileItem) => void
  onRestore: (fileId: string) => void
  onPermanentDelete: (fileId: string) => void
  filter: FilterType
  onEnterFolder?: (folderId: string) => void
}) {
  const [deleteConfirm, setDeleteConfirm] = React.useState(false)
  const [permanentDeleteConfirm, setPermanentDeleteConfirm] = React.useState(false)

  if (viewMode === "list") {
    return (
      <>
        <div className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer">
          <div
            className="text-xl md:text-2xl flex-shrink-0"
            onClick={() => onFileView(file.id)}
          >
            {getFileIcon(file.fileType)}
          </div>
          <div className="flex-1 min-w-0" onClick={() => onFileView(file.id)}>
            <p className="font-medium truncate text-sm md:text-base">{file.fileName}</p>
          </div>
          <div className="hidden sm:block text-xs md:text-sm text-muted-foreground w-16 md:w-20 flex-shrink-0">
            {formatFileSize(file.fileSize)}
          </div>
          <div className="hidden lg:block text-xs md:text-sm text-muted-foreground w-20 md:w-24 flex-shrink-0">
            {formatRelativeTime(file.uploadTime)}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {file.starred && (
              <Star className="h-3 w-3 md:h-4 md:w-4 fill-warning text-warning" />
            )}
            {file.sharedWith > 0 && (
              <Users className="h-3 w-3 md:h-4 md:w-4 text-info" />
            )}
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
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onFileView(file.id);
                }}>
                  <span>View</span>
                </DropdownMenuItem>
                {!file.isDeleted && (
                  <>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar(file.id);
                    }}>
                      <Star className="mr-2 h-4 w-4" />
                      <span>{file.starred ? "Unstar" : "Star"}</span>
                    </DropdownMenuItem>
                    {file.fileUrl && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onDownload(file);
                      }}>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Download</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onRename(file);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(true);
                    }} className="text-destructive">
                      <Trash className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </>
                )}
                {file.isDeleted && (
                  <>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onRestore(file.id);
                    }}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      <span>Restore</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setPermanentDeleteConfirm(true);
                    }} className="text-destructive">
                      <Trash className="mr-2 h-4 w-4" />
                      <span>Delete Permanently</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete File</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{file.fileName}"? You can restore it later from Trash.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onDelete(file.id)
                  setDeleteConfirm(false)
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={permanentDeleteConfirm} onOpenChange={setPermanentDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently Delete File</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete "{file.fileName}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onPermanentDelete(file.id)
                  setPermanentDeleteConfirm(false)
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Permanently
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <>
      <Card
        className="group hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer"
        onClick={() => {
          if (file.isFolder && onEnterFolder) {
            onEnterFolder(file.id)
          } else {
            onFileView(file.id)
          }
        }}
      >
        <CardContent className="p-3 md:p-4">
          <div className="flex items-start justify-between mb-2 md:mb-3">
            <div className="text-2xl md:text-3xl">{getFileIcon(file.fileType)}</div>
            <div className="flex items-center gap-1">
              {file.starred && (
                <Star className="h-3 w-3 md:h-4 md:w-4 fill-warning text-warning" />
              )}
              {file.sharedWith > 0 && (
                <Users className="h-3 w-3 md:h-4 md:w-4 text-info" />
              )}
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
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onFileView(file.id);
                  }}>
                    <span>View</span>
                  </DropdownMenuItem>
                  {!file.isDeleted && (
                    <>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(file.id);
                      }}>
                        <Star className="mr-2 h-4 w-4" />
                        <span>{file.starred ? "Unstar" : "Star"}</span>
                      </DropdownMenuItem>
                      {file.fileUrl && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onDownload(file);
                        }}>
                          <Download className="mr-2 h-4 w-4" />
                          <span>Download</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onRename(file);
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(true);
                      }} className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  {file.isDeleted && (
                    <>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onRestore(file.id);
                      }}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        <span>Restore</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setPermanentDeleteConfirm(true);
                      }} className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Delete Permanently</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-xs md:text-sm truncate" title={file.fileName}>
              {file.fileName}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatFileSize(file.fileSize)}</span>
              <span className="hidden sm:block">{formatRelativeTime(file.uploadTime)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{file.fileName}"? You can restore it later from Trash.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(file.id)
                setDeleteConfirm(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={permanentDeleteConfirm} onOpenChange={setPermanentDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{file.fileName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onPermanentDelete(file.id)
                setPermanentDeleteConfirm(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function MainContent({
  onFileView,
  filter,
  files,
  loading,
  onToggleStar,
  onDelete,
  onRename,
  onDownload,
  onUpload,
  onRestore,
  onPermanentDelete,
  onCreateFolder,
  folderId,
  folderPath,
  onEnterFolder,
  onExitFolder,
  uploadingFiles,
  searchQuery,
}: {
  onFileView: (fileId: string) => void
  filter: FilterType
  files: FileItem[]
  loading: boolean
  onToggleStar: (fileId: string) => void
  onDelete: (fileId: string) => void
  onRename: (fileId: string, newName: string) => Promise<any>
  onDownload: (file: FileItem) => void
  onUpload: (file: File) => Promise<any>
  onRestore: (fileId: string) => void
  onPermanentDelete: (fileId: string) => void
  onCreateFolder: (folderName: string) => Promise<any>
  folderId: string | null
  folderPath: Array<{ id: string; name: string }>
  onEnterFolder: (folderId: string) => void
  onExitFolder: () => void
  uploadingFiles: UploadingFile[]
  searchQuery?: string
}) {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false)
  const [fileToRename, setFileToRename] = React.useState<FileItem | null>(null)
  const [mounted, setMounted] = React.useState(false)
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false)
  const [folderName, setFolderName] = React.useState("")
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const folderInputRef = React.useRef<HTMLInputElement>(null)
  const [contextMenuOpen, setContextMenuOpen] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Filter files based on search query
  const filteredFiles = React.useMemo(() => {
    if (!searchQuery?.trim()) {
      return files
    }
    const query = searchQuery.toLowerCase()
    return files.filter((file) =>
      file.fileName.toLowerCase().includes(query)
    )
  }, [files, searchQuery])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.currentTarget.files
    if (selectedFiles) {
      for (let i = 0; i < selectedFiles.length; i++) {
        await onUpload(selectedFiles[i])
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.currentTarget.files
    if (selectedFiles) {
      for (let i = 0; i < selectedFiles.length; i++) {
        await onUpload(selectedFiles[i])
      }
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = ""
    }
  }

  const handleRename = (file: FileItem) => {
    setFileToRename(file)
    setRenameDialogOpen(true)
  }

  const getFilterTitle = () => {
    const titles: Record<FilterType, string> = {
      "my-drive": "My Drive",
      shared: "Shared with me",
      recent: "Recent",
      starred: "Starred",
      trash: "Trash",
    }
    return titles[filter]
  }

  const getFilterDescription = () => {
    const descriptions: Record<FilterType, string> = {
      "my-drive": "Manage your files and folders",
      shared: "Files shared with you",
      recent: "Recently modified files",
      starred: "Your starred files",
      trash: "Deleted files",
    }
    return descriptions[filter]
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-6 border-b">
        <div>
          {folderId && folderPath.length > 0 ? (
            <div className="mb-2 flex items-center gap-1 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={onExitFolder}
                className="h-6 px-2"
              >
                {getFilterTitle()}
              </Button>
              {folderPath.map((folder, index) => (
                <div key={folder.id} className="flex items-center gap-1">
                  <span className="text-muted-foreground">/</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Navigate to this folder
                      if (index === folderPath.length - 1) {
                        // Already at this folder
                        return
                      }
                      // TODO: Implement navigating to parent folders
                    }}
                    className="h-6 px-2"
                  >
                    {folder.name}
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
          <h1 className="text-xl md:text-2xl font-semibold">
            {folderId && folderPath.length > 0 ? folderPath[folderPath.length - 1].name : getFilterTitle()}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">{getFilterDescription()}</p>
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
          {filter !== "trash" && filter !== "shared" && (
            <>
              {mounted && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    onChange={handleFolderSelect}
                    className="hidden"
                    {...({ webkitdirectory: 'true' } as any)}
                  />
                </>
              )}
              <Button
                variant="outline"
                className="gap-2 h-8 md:h-10 px-3 md:px-4 text-sm"
                onClick={() => setCreateFolderOpen(true)}
              >
                <FolderPlus className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">New Folder</span>
              </Button>
              <Button
                className="gap-2 h-8 md:h-10 px-3 md:px-4 text-sm"
                onClick={() => mounted && fileInputRef.current?.click()}
              >
                <Upload className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex-1 p-4 md:p-6 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading files...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  {searchQuery?.trim() ? (
                    `No files match "${searchQuery}"`
                  ) : filter === "trash" ? (
                    "No deleted files"
                  ) : filter === "shared" ? (
                    "No files shared with you"
                  ) : filter === "starred" ? (
                    "No starred files"
                  ) : filter === "recent" ? (
                    "No recent files"
                  ) : (
                    "No files yet"
                  )}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    viewMode={viewMode}
                    onFileView={onFileView}
                    onToggleStar={onToggleStar}
                    onDelete={onDelete}
                    onRename={handleRename}
                    onDownload={onDownload}
                    onRestore={onRestore}
                    onPermanentDelete={onPermanentDelete}
                    filter={filter}
                    onEnterFolder={onEnterFolder}
                  />
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
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    viewMode={viewMode}
                    onFileView={onFileView}
                    onToggleStar={onToggleStar}
                    onDelete={onDelete}
                    onRename={handleRename}
                    onDownload={onDownload}
                    onRestore={onRestore}
                    onPermanentDelete={onPermanentDelete}
                    filter={filter}
                    onEnterFolder={onEnterFolder}
                  />
                ))}
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        
        {filter !== "trash" && filter !== "shared" && (
          <ContextMenuContent className="w-48">
            <ContextMenuItem 
              onClick={() => setCreateFolderOpen(true)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <FolderPlus className="h-4 w-4" />
              <span>New Folder</span>
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={() => mounted && fileInputRef.current?.click()}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>File Upload</span>
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={() => mounted && folderInputRef.current?.click()}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Folder className="h-4 w-4" />
              <span>Folder Upload</span>
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>

      <RenameDialog
        open={renameDialogOpen}
        file={fileToRename}
        onOpenChange={setRenameDialogOpen}
        onRename={async (newName) => {
          if (fileToRename && fileToRename.id && newName) {
            await onRename(fileToRename.id, newName)
            setRenameDialogOpen(false)
          }
        }}
      />
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onCreateFolder={(folderName) => {
          onCreateFolder(folderName)
        }}
      />

      {/* Upload Progress Overlay */}
      {uploadingFiles.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-none">
          <Card className="w-full max-w-md mx-4 pointer-events-auto shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Uploading Files ({uploadingFiles.length})</h3>
              <div className="space-y-4">
                {uploadingFiles.map((file) => (
                  <div key={file.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2 min-h-6">
                      <span className="text-sm font-medium truncate flex-1" title={file.fileName}>
                        {file.fileName}
                      </span>
                      <span className="text-sm text-muted-foreground font-semibold whitespace-nowrap ml-2">
                        {file.progress}%
                      </span>
                    </div>
                    <Progress value={file.progress} className="h-2.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export function FileManager({ onNavigate, onLogout, onFileView }: FileManagerProps) {
  const {
    files,
    loading,
    filter,
    folderId,
    folderPath,
    sharedCount,
    uploadingFiles,
    uploadFile,
    toggleStar,
    renameFile,
    deleteFile,
    restoreFile,
    permanentlyDeleteFile,
    downloadFile,
    changeFilter,
    enterFolder,
    exitFolder,
    createFolder,
  } = useFileManager()

  const [searchQuery, setSearchQuery] = React.useState("")

  // Calculate total storage used (only count non-deleted files)
  const totalStorageUsed = React.useMemo(() => {
    return files
      .filter(file => !file.isDeleted)
      .reduce((total, file) => total + file.fileSize, 0)
  }, [files])

  return (
    <div className="flex h-screen bg-background">
      <DesktopSidebar
        filter={filter}
        onFilterChange={changeFilter}
        sharedCount={sharedCount}
        totalStorageUsed={totalStorageUsed}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavigation 
          onNavigate={onNavigate} 
          onLogout={onLogout} 
          onFileView={onFileView}
          filter={filter}
          onFilterChange={changeFilter}
          sharedCount={sharedCount}
          totalStorageUsed={totalStorageUsed}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <MainContent
          onFileView={onFileView}
          filter={filter}
          files={files}
          loading={loading}
          onToggleStar={toggleStar}
          onDelete={deleteFile}
          onRename={renameFile}
          onDownload={downloadFile}
          onUpload={uploadFile}
          onRestore={restoreFile}
          onPermanentDelete={permanentlyDeleteFile}
          onCreateFolder={createFolder}
          folderId={folderId}
          folderPath={folderPath}
          onEnterFolder={enterFolder}
          onExitFolder={exitFolder}
          uploadingFiles={uploadingFiles}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  )
}
