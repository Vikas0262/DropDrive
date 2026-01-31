"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ArrowLeft, CheckCircle, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { showToast } from "@/lib/toast/toastHelper"

function AuthNavigation() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4 px-4 md:px-6">
        <div className="flex items-center gap-0">
          <div className="relative h-12 w-12 flex-shrink-0 rounded-full overflow-hidden pt-1.2">
            <img
              src="/logoicon.png"
              alt="DropDrive Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="font-semibold text-lg">DropDrive</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1 md:gap-2">
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

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(email)) {
      showToast.warning("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process request")
      }

      showToast.success("Reset link sent to your email!")
      setIsEmailSent(true)
    } catch (error: any) {
      console.error("Forgot password error:", error)
      const errorMsg = error.message || "Failed to send reset link. Please try again."
      setError(errorMsg)
      showToast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-background" suppressHydrationWarning>
        <AuthNavigation />

        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4" suppressHydrationWarning>
          <div className="w-full max-w-md">
            <Card className="shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <CardTitle className="text-2xl font-semibold">Check your email</CardTitle>
                <CardDescription>
                  We've sent a password reset link to <strong>{email}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center text-sm text-muted-foreground">
                  <p>Didn't receive the email? Check your spam folder or</p>
                  <Button variant="link" className="px-0 text-sm font-medium" onClick={() => setIsEmailSent(false)}>
                    try another email address
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/auth/login")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <AuthNavigation />

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4" suppressHydrationWarning>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Forgot your password?</h1>
            <p className="text-muted-foreground">
              No worries! Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-semibold text-center">Reset Password</CardTitle>
              <CardDescription className="text-center">
                Enter your email address and we'll send you a reset link
              </CardDescription>
            </CardHeader>
            <CardContent suppressHydrationWarning>
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}
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
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/auth/login")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
