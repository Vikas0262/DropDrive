"use client"

import { useRouter, useParams } from "next/navigation"
import { FileViewerPage } from "@/components/file-viewer/file-viewer-page"

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

  const handleLogout = () => {
    router.push("/auth/login")
  }

  return <FileViewerPage fileId={fileId} onNavigate={handleNavigate} onLogout={handleLogout} />
}
