"use client"

import { useRouter } from "next/navigation"
import { FileManager } from "@/components/file-manager"

export default function DashboardPage() {
  const router = useRouter()

  const handleNavigate = (page: "profile" | "dashboard") => {
    if (page === "profile") {
      router.push("/profile")
    }
  }

  const handleLogout = () => {
    router.push("/auth/login")
  }

  const handleFileView = (fileId: string) => {
    router.push(`/file/${fileId}`)
  }

  return <FileManager onNavigate={handleNavigate} onLogout={handleLogout} onFileView={handleFileView} />
}
