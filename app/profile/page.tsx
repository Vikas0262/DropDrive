"use client"

import { useRouter } from "next/navigation"
import { ProfilePage } from "@/components/profile/profile-page"
import { ProtectedRoute } from "@/components/protected-route"

export default function Profile() {
  const router = useRouter()

  const handleNavigate = (page: "dashboard" | "profile") => {
    if (page === "dashboard") {
      router.push("/dashboard")
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
      <ProfilePage onNavigate={handleNavigate} onLogout={handleLogout} />
    </ProtectedRoute>
  )
}
