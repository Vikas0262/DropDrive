"use client"

import * as React from "react"
import {
  Sun,
  Moon,
  Bell,
  Settings,
  LogOut,
  Upload,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { getSessionUser, setSessionUser } from "@/lib/auth/session"
import { showToast } from "@/lib/toast/toastHelper"
import { ImageCropperModal } from "@/components/image-cropper-modal"

interface ProfilePageProps {
  onNavigate: (page: "dashboard" | "profile") => void
  onLogout: () => void
}

function ProfileNavigation({ onNavigate, onLogout }: ProfilePageProps) {
  const { theme, setTheme } = useTheme()
  const [user, setUser] = React.useState<any>(null)
  const [profilePicture, setProfilePicture] = React.useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const userData = getSessionUser()
    if (userData) {
      setUser(userData)
      // Fetch profile picture if user exists
      if (userData._id) {
        fetchProfilePicture(userData._id)
      }
    }

    // Listen for user updates
    const handleUserUpdate = () => {
      const updatedUserData = getSessionUser()
      if (updatedUserData) {
        setUser(updatedUserData)
        // Refresh profile picture when user is updated
        if (updatedUserData._id) {
          fetchProfilePicture(updatedUserData._id)
        }
      }
    }

    window.addEventListener("userUpdated", handleUserUpdate)
    return () => window.removeEventListener("userUpdated", handleUserUpdate)
  }, [])

  const fetchProfilePicture = async (userId: string) => {
    try {
      setIsLoadingImage(true)
      const response = await fetch(`/api/auth/profile?userId=${userId}&includeImage=true`)
      const data = await response.json()
      if (data.user?.profilePicture) {
        setProfilePicture(data.user.profilePicture)
      }
    } catch (error) {
      console.error('Failed to fetch profile picture:', error)
    } finally {
      setIsLoadingImage(false)
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U"
    const first = firstName?.[0]?.toUpperCase() || ""
    const last = lastName?.[0]?.toUpperCase() || ""
    return (first + last).slice(0, 2)
  }

  if (!mounted) {
    return (
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4 px-4 md:px-6">
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4 px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("dashboard")}
          className="h-8 w-8 md:h-9 md:w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

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

          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
            <Bell className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 md:h-9 md:w-9 rounded-full">
                <Avatar className="h-7 w-7 md:h-8 md:w-8 bg-primary">
                  {profilePicture && !isLoadingImage && (
                    <AvatarImage src={profilePicture} alt={user?.firstName} />
                  )}
                  <AvatarFallback className="text-white font-semibold text-sm">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <Avatar className="h-10 w-10 bg-primary">
                  {profilePicture && !isLoadingImage && (
                    <AvatarImage src={profilePicture} alt={user?.firstName} />
                  )}
                  <AvatarFallback className="text-white font-semibold">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="w-[140px] truncate text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export function ProfilePage({ onNavigate, onLogout }: ProfilePageProps) {
  const [user, setUser] = React.useState<any>(null)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [profilePicturePreview, setProfilePicturePreview] = React.useState<string | null>(null)
  const [cropperOpen, setCropperOpen] = React.useState(false)
  const [selectedImageForCrop, setSelectedImageForCrop] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    profilePicture: null as string | null,
  })

  React.useEffect(() => {
    const userData = getSessionUser()
    if (userData) {
      setUser(userData)
      setFormData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        profilePicture: null, // Don't load from session to avoid large data
      })
      
      // Fetch profile picture separately if user has one
      if (userData._id) {
        fetchProfilePicture(userData._id)
      }
    }
  }, [])

  const fetchProfilePicture = async (userId: string) => {
    try {
      const response = await fetch(`/api/auth/profile?userId=${userId}&includeImage=true`)
      const data = await response.json()
      if (data.user?.profilePicture) {
        setProfilePicturePreview(data.user.profilePicture)
        setFormData((prev) => ({
          ...prev,
          profilePicture: data.user.profilePicture,
        }))
      }
    } catch (error) {
      console.error('Failed to fetch profile picture:', error)
    }
  }

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast.error("Image size must be less than 5MB")
        return
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast.error("Please select a valid image file")
        return
      }

      // Convert to base64 and open cropper
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setSelectedImageForCrop(base64String)
        setCropperOpen(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (croppedImage: string) => {
    setProfilePicturePreview(croppedImage)
    setFormData((prev) => ({
      ...prev,
      profilePicture: croppedImage,
    }))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showToast.warning("First name and last name are required")
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          profilePicture: formData.profilePicture,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile")
      }

      // Update localStorage and state
      setSessionUser(data.user)
      setUser(data.user)
      setIsEditing(false)

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("userUpdated"))

      showToast.success("Profile updated successfully!")
    } catch (error: any) {
      console.error("Profile update error:", error)
      showToast.error(error.message || "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePicture: user.profilePicture || null,
      })
      setProfilePicturePreview(user.profilePicture || null)
    }
    setIsEditing(false)
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U"
    const first = firstName?.[0]?.toUpperCase() || ""
    const last = lastName?.[0]?.toUpperCase() || ""
    return (first + last).slice(0, 2)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <ProfileNavigation onNavigate={onNavigate} onLogout={onLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
          <div className="text-center">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfileNavigation onNavigate={onNavigate} onLogout={onLogout} />

      <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account information and settings</p>
        </div>

        <div className="grid gap-6">
          {/* Profile Picture Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Upload and manage your profile picture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => {
                      if (isEditing) {
                        fileInputRef.current?.click()
                      }
                    }}
                    disabled={!isEditing}
                    className={`relative group ${isEditing ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <Avatar className="h-32 w-32 bg-primary">
                      {profilePicturePreview && (
                        <AvatarImage src={profilePicturePreview} alt={formData.firstName} />
                      )}
                      <AvatarFallback className="text-white font-semibold text-3xl">
                        {getInitials(formData.firstName, formData.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </button>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Image
                      </Button>
                      {profilePicturePreview && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setProfilePicturePreview(null)
                            setFormData((prev) => ({
                              ...prev,
                              profilePicture: null,
                            }))
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </div>

                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-4">
                    Click on the circle to upload a profile picture. You can crop and adjust it in the popup.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Recommended size: 400x400px. Max file size: 5MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Cropper Modal */}
          {selectedImageForCrop && (
            <ImageCropperModal
              open={cropperOpen}
              onOpenChange={setCropperOpen}
              imageSrc={selectedImageForCrop}
              onCropComplete={handleCropComplete}
            />
          )}

          {/* Profile Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      disabled={!isEditing}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    placeholder="john@example.com"
                  />
                  <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinDate">Member Since</Label>
                  <Input
                    id="joinDate"
                    value={new Date(user.createdAt).toLocaleDateString()}
                    disabled
                    placeholder="Join date"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="gap-2">
                <Settings className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
