"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Download, FileText, Calendar, HardDrive, Maximize2, Minimize2, Shield } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking"
import { InteractionType } from "@/types/analytics"

interface FileData {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  uploadTime: string
  description: string
  isFolder: boolean
  permission: 'secure-view' | 'full-access'
}

export default function SharedFilePage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [file, setFile] = useState<FileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Initialize analytics tracking
  const { trackInteraction } = useAnalyticsTracking({
    fileId: file?.id || '',
    permission: file?.permission || 'full-access',
    enabled: !!file,
  })

  useEffect(() => {
    const fetchSharedFile = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/shared/${slug}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to load shared file")
        }

        const data = await response.json()
        setFile(data)
      } catch (err: any) {
        setError(err.message || "An error occurred while loading the shared file")
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchSharedFile()
    }
  }, [slug])

  // Secure viewing controls
  useEffect(() => {
    if (!file || file.permission !== 'secure-view') return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      trackInteraction(InteractionType.COPY_ATTEMPT)
      toast.error("Screenshot and right-click are disabled for this file", {
        description: "This file is in secure view mode",
      })
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent screenshot shortcuts and other keys
      const key = e.key.toLowerCase()
      
      if (
        (key === 'printscreen') ||
        (e.code === 'PrintScreen') ||
        (e.keyCode === 44) || // PrintScreen keycode
        (e.metaKey && e.shiftKey && (key === '3' || key === '4' || key === '5')) || // Mac screenshots
        (e.ctrlKey && key === 'p') || // Print
        (e.metaKey && key === 'p') || // Mac print
        (e.ctrlKey && e.shiftKey && key === 's') || // Save as
        (e.metaKey && e.shiftKey && key === 's') || // Mac save as
        (e.altKey && key === 'printscreen') || // Alt + PrintScreen
        (e.key === 'F12') || // DevTools
        (e.ctrlKey && e.shiftKey && key === 'i') || // DevTools
        (e.ctrlKey && e.shiftKey && key === 'j') || // DevTools Console
        (e.ctrlKey && key === 'u') // View Source
      ) {
        e.preventDefault()
        e.stopPropagation()
        
        // Track screenshot/print attempts
        if (key === 'printscreen' || e.code === 'PrintScreen' || e.keyCode === 44 || 
            (e.metaKey && e.shiftKey && (key === '3' || key === '4' || key === '5'))) {
          trackInteraction(InteractionType.SCREENSHOT_ATTEMPT)
        } else if ((e.ctrlKey || e.metaKey) && key === 'p') {
          trackInteraction(InteractionType.PRINT_ATTEMPT)
        }
        
        toast.error("This action is disabled for secure view files", {
          description: "Screenshots, downloads, and printing are not allowed",
        })
        return false
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'printscreen' || e.code === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault()
        e.stopPropagation()
        trackInteraction(InteractionType.SCREENSHOT_ATTEMPT)
        toast.error("Screenshots are not allowed in secure view mode", {
          description: "This content is protected",
        })
        return false
      }
    }

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      trackInteraction(InteractionType.COPY_ATTEMPT)
      toast.error("Copying is disabled for this file", {
        description: "This file is in secure view mode",
      })
    }

    // Detect potential screenshot attempts via blur/visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Document became hidden - possible screenshot tool
        trackInteraction(InteractionType.SCREENSHOT_ATTEMPT, { method: 'visibility_change' })
        setTimeout(() => {
          if (!document.hidden) {
            toast.warning("Screenshot attempt detected", {
              description: "This content is protected and monitored",
            })
          }
        }, 100)
      }
    }

    const handleBlur = () => {
      // Window lost focus - possible screenshot tool activated
      setTimeout(() => {
        if (!document.hasFocus()) {
          trackInteraction(InteractionType.SCREENSHOT_ATTEMPT, { method: 'window_blur' })
          console.warn('Potential screenshot attempt - window lost focus')
        }
      }, 100)
    }

    // Disable print dialog
    window.onbeforeprint = (e) => {
      e.preventDefault()
      trackInteraction(InteractionType.PRINT_ATTEMPT)
      toast.error("Printing is disabled for this file", {
        description: "This file is in secure view mode",
      })
      return false
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown, true) // Use capture phase
    document.addEventListener('keyup', handleKeyUp, true) // Use capture phase
    document.addEventListener('copy', handleCopy)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)

    // Disable drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault()
    }
    document.addEventListener('dragstart', handleDragStart)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keyup', handleKeyUp, true)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('dragstart', handleDragStart)
      window.onbeforeprint = null
    }
  }, [file, trackInteraction])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleDownload = () => {
    if (file?.permission === 'secure-view') {
      trackInteraction(InteractionType.DOWNLOAD_BLOCKED)
      toast.error("Download is disabled for this file", {
        description: "This file is in secure view mode",
      })
      return
    }

    // Track successful download for full-access
    trackInteraction(InteractionType.DOWNLOAD)

    if (file?.fileUrl) {
      window.open(file.fileUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600 mb-4"></div>
          <p className="text-slate-600">Loading shared file...</p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="text-center space-y-4">
            <p className="text-sm text-slate-600">
              The file you're looking for either doesn't exist, has been removed, or the link has expired.
            </p>
            <Link href="/">
              <Button className="w-full">Go to Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <p className="text-slate-600">File not found</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Security Badge for Secure View */}
      {file?.permission === 'secure-view' && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          Secure View Mode: Screenshots, downloads, and copying are disabled
        </div>
      )}

      {/* Watermark Overlay for Secure View */}
      {file?.permission === 'secure-view' && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="grid grid-cols-3 grid-rows-3 w-full h-full opacity-10">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center">
                <div className="transform rotate-[-45deg] text-4xl font-bold text-red-600 whitespace-nowrap">
                  SECURE VIEW • {new Date().toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PDF Viewer - Full Height */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {file.fileType === "image" && (
          <div 
            className="flex items-center justify-center bg-slate-100 flex-1 overflow-auto relative group"
            onContextMenu={(e) => file.permission === 'secure-view' && e.preventDefault()}
            style={file.permission === 'secure-view' ? {
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              userSelect: 'none',
            } : {}}
          >
            <img
              src={file.fileUrl}
              alt={file.fileName}
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onMouseDown={(e) => file.permission === 'secure-view' && e.preventDefault()}
              style={file.permission === 'secure-view' ? { 
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                KhtmlUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                userSelect: 'none',
                pointerEvents: 'auto',
              } : {}}
            />
            {file.permission === 'full-access' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(true)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 className="h-5 w-5" />
              </Button>
            )}
            {file.permission === 'full-access' && (
              <Button
                variant="default"
                size="sm"
                onClick={handleDownload}
                className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        )}

        {file.fileType === "video" && (
          <div className="flex items-center justify-center bg-black flex-1 overflow-hidden">
            <video
              src={file.fileUrl}
              controls={file.permission === 'full-access'}
              controlsList={file.permission === 'secure-view' ? "nodownload" : undefined}
              className="max-h-full max-w-full"
              style={{ height: "100%", width: "100%" }}
              onContextMenu={(e) => file.permission === 'secure-view' && e.preventDefault()}
            />
          </div>
        )}

        {file.fileType === "pdf" && (
          <div className="flex-1 w-full overflow-hidden">
            <iframe
              src={`${file.fileUrl}#toolbar=${file.permission === 'full-access' ? '1' : '0'}&navpanes=0&scrollbar=1`}
              title={file.fileName}
              className="w-full h-full border-0"
              style={file.permission === 'secure-view' ? {
                pointerEvents: 'none',
              } : {}}
            />
            {file.permission === 'secure-view' && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }} />
            )}
          </div>
        )}

        {file.fileType !== "image" && file.fileType !== "pdf" && file.fileType !== "video" && (
          <div className="flex items-center justify-center bg-slate-100 flex-1">
            <div className="text-center space-y-4">
              <div className="inline-block p-8 bg-blue-100 rounded-lg mb-4">
                <FileText className="h-16 w-16 text-blue-600 mx-auto" />
              </div>
              <p className="text-slate-600">
                Preview not available for this file type.
                {file.permission === 'full-access' && (
                  <>
                    <br />
                    Click "Download File" to access it.
                  </>
                )}
              </p>
              {file.permission === 'full-access' && (
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Image Modal */}
      {isFullscreen && file?.fileType === "image" && file?.permission === 'full-access' && (
        <div 
          className="fixed inset-0 bg-black z-50 flex items-center justify-center w-screen h-screen overflow-hidden"
          onClick={() => setIsFullscreen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-51"
          >
            <Minimize2 className="h-6 w-6" />
          </Button>
          <img
            src={file.fileUrl}
            alt={file.fileName}
            className="max-h-screen max-w-screen object-contain w-full h-full"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
