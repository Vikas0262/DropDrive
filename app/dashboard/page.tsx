"use client"

import { useRouter } from "next/navigation"
import { FileManager } from "@/components/file-manager"
import { ProtectedRoute } from "@/components/protected-route"

export default function DashboardPage() {
  const router = useRouter()

  const handleNavigate = (page: "profile" | "dashboard") => {
    if (page === "profile") {
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

  const handleFileView = (fileId: string) => {
    router.push(`/file/${fileId}`)
  }

  return (
    <ProtectedRoute>
      <FileManager onNavigate={handleNavigate} onLogout={handleLogout} onFileView={handleFileView} />
    </ProtectedRoute>
  )
}
