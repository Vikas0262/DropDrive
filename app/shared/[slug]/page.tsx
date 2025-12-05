"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Download, FileText, Calendar, HardDrive, Maximize2, Minimize2 } from "lucide-react"
import Link from "next/link"

interface FileData {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  uploadTime: string
  description: string
  isFolder: boolean
}

export default function SharedFilePage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [file, setFile] = useState<FileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

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
      

      {/* PDF Viewer - Full Height */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {file.fileType === "image" && (
          <div className="flex items-center justify-center bg-slate-100 flex-1 overflow-auto relative group">
            <img
              src={file.fileUrl}
              alt={file.fileName}
              className="max-h-full max-w-full object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(true)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
          </div>
        )}

        {file.fileType === "video" && (
          <div className="flex items-center justify-center bg-black flex-1 overflow-hidden">
            <video
              src={file.fileUrl}
              controls
              className="max-h-full max-w-full"
              style={{ height: "100%", width: "100%" }}
            />
          </div>
        )}

        {file.fileType === "pdf" && (
          <div className="flex-1 w-full overflow-hidden">
            <iframe
              src={`${file.fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              title={file.fileName}
              className="w-full h-full border-0"
            />
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
                <br />
                Click "Download File" to access it.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Image Modal */}
      {isFullscreen && file?.fileType === "image" && (
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
