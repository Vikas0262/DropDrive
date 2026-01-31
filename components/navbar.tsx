"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getSessionUser } from "@/lib/auth/session"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { NotificationDropdown } from "@/components/notification-dropdown"

export function Navbar() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const sessionUser = getSessionUser()
    setUser(sessionUser)
    setIsLoading(false)
  }, [])

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Clear local storage
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      
      // Redirect to home page
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear local storage and redirect even if API fails
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      router.push("/")
    }
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4 px-4 md:px-6">
        {/* Logo */}
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

        <div className="flex-1" />

        {/* Auth Buttons & Theme Toggle */}
        <div className="flex items-center gap-1 md:gap-2">
          {!isLoading && !user ? (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="h-8 md:h-9">
                  Login
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="h-8 md:h-9">
                  Signup
                </Button>
              </Link>
            </>
          ) : null}
          
          {/* Notification Icon - only show when user is logged in */}
          {!isLoading && user && <NotificationDropdown />}
          
          {/* Theme Toggle */}
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
        </div>
      </div>
    </header>
  )
}
