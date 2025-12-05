"use client"

import { useRouter, useParams } from "next/navigation"
import { FileViewerPage } from "@/components/file-viewer/file-viewer-page"
import { ProtectedRoute } from "@/components/protected-route"

export default function FileViewer() {
  const router = useRouter()
  const params = useParams()
  const fileId = params.id as string || null

  const handleNavigate = (page: "dashboard" | "profile" | "file-viewer") => {
    if (page === "dashboard") {
      router.push("/dashboard")
    } else if (page === "profile") {
      router.push("/profile")
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      router.push("/")
    }
  }

  return (
    <ProtectedRoute>
      <FileViewerPage fileId={fileId} onNavigate={handleNavigate} onLogout={handleLogout} />
    </ProtectedRoute>
  )
}
