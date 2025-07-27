"use client"

import { useRouter } from "next/navigation"
import { ProfilePage } from "@/components/profile/profile-page"

export default function Profile() {
  const router = useRouter()

  const handleNavigate = (page: "dashboard" | "profile") => {
    if (page === "dashboard") {
      router.push("/dashboard")
    }
  }

  const handleLogout = () => {
    router.push("/auth/login")
  }

  return <ProfilePage onNavigate={handleNavigate} onLogout={handleLogout} />
}
