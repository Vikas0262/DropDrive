"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Eye, EyeOff, Mail, Lock, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { setSessionUser } from "@/lib/auth/session"
import { showToast } from "@/lib/toast/toastHelper"
import Link from "next/link"

function AuthNavigation() {
  const { theme, setTheme } = useTheme()

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

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 md:h-9 md:w-9"
            suppressHydrationWarning
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

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const [showGoogleDialog, setShowGoogleDialog] = useState(false)
  const [showGithubDialog, setShowGithubDialog] = useState(false)

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true)
      setShowGoogleDialog(false)
      
      // Call the API to get Google OAuth URL
      const response = await fetch('/api/auth/google')
      const data = await response.json()
      
      if (data.url) {
        // Redirect to Google OAuth page
        window.location.href = data.url
      } else {
        showToast.error('Failed to initiate Google login')
        setIsGoogleLoading(false)
      }
    } catch (error) {
      console.error('Error initiating Google login:', error)
      showToast.error('Failed to initiate Google login')
      setIsGoogleLoading(false)
    }
  }

  const handleGithubLogin = async () => {
    try {
      setIsGithubLoading(true)
      setShowGithubDialog(false)
      
      // Call the API to get GitHub OAuth URL
      const response = await fetch('/api/auth/github')
      const data = await response.json()
      
      if (data.url) {
        // Redirect to GitHub OAuth page
        window.location.href = data.url
      } else {
        showToast.error('Failed to initiate GitHub login')
        setIsGithubLoading(false)
      }
    } catch (error) {
      console.error('Error initiating GitHub login:', error)
      showToast.error('Failed to initiate GitHub login')
      setIsGithubLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(email)) {
      showToast.warning("Please enter a valid email address")
      return
    }
    
    // Validate password length
    if (password.length < 8) {
      showToast.warning("Password must be at least 8 characters long")
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      showToast.success("Login successful!")
      
      // Store user session
      setSessionUser(data.user)

      // Redirect to dashboard after successful login
      router.push("/dashboard")
    } catch (error: any) {
      console.error('Login error:', error)
      showToast.error(error.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <AuthNavigation />

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4" suppressHydrationWarning>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Please sign in to your account to continue.</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-semibold text-center">Sign In</CardTitle>
              <CardDescription className="text-center">
                Enter your email and password to access your files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" suppressHydrationWarning>
              <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      suppressHydrationWarning
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      suppressHydrationWarning
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      suppressHydrationWarning
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm"
                    onClick={() => router.push("/auth/forgot-password")}
                    suppressHydrationWarning
                  >
                    Forgot password?
                  </Button>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading} suppressHydrationWarning>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="w-full bg-transparent"
                  onClick={() => setShowGoogleDialog(true)}
                  disabled={isGoogleLoading}
                  type="button"
                  suppressHydrationWarning
                >
                  {isGoogleLoading ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full bg-transparent"
                  onClick={() => setShowGithubDialog(true)}
                  disabled={isGithubLoading}
                  type="button"
                  suppressHydrationWarning
                >
                  {isGithubLoading ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                      </svg>
                      GitHub
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
            <CardFooter suppressHydrationWarning>
              <div className="text-center text-sm text-muted-foreground w-full" suppressHydrationWarning>
                Don't have an account?{" "}
                <Button
                  variant="link"
                  className="px-0 text-sm font-medium"
                  onClick={() => router.push("/auth/register")}
                  suppressHydrationWarning
                >
                  Sign up
                </Button>
              </div>
            </CardFooter>
          </Card>

          {/* Google OAuth Confirmation Dialog */}
          <AlertDialog open={showGoogleDialog} onOpenChange={setShowGoogleDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Continue with Google?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be redirected to Google to sign in securely. Make sure you trust this application before proceeding.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleGoogleLogin}>
                  Continue with Google
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* GitHub OAuth Confirmation Dialog */}
          <AlertDialog open={showGithubDialog} onOpenChange={setShowGithubDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Continue with GitHub?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be redirected to GitHub to sign in securely. Make sure you trust this application before proceeding.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleGithubLogin}>
                  Continue with GitHub
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
