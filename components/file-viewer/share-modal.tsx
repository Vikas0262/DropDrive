"use client"

import { useState, useEffect, useCallback } from "react"
import { getSessionUser } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Globe, Copy, Check, X, Eye, Edit, UserPlus, Link, Send, AlertCircle, BarChart3 } from "lucide-react"
import { AnalyticsView } from "./analytics-view"
import { useToast } from "@/components/ui/use-toast"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  file: any
}

interface ShareStatus {
  isPublic: boolean
  publicSlug: string | null
  publicLink: string | null
  publicLinkExpiry: string | null
  publicLinkPermission: 'secure-view' | 'full-access'
}

export function ShareModal({ isOpen, onClose, file }: ShareModalProps) {
  const user = getSessionUser()
  const { toast } = useToast()
  const [shareStatus, setShareStatus] = useState<ShareStatus | null>(null)
  const [publicLinkEnabled, setPublicLinkEnabled] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [permission, setPermission] = useState("view")
  const [sharedUsers, setSharedUsers] = useState<any[]>(Array.isArray(file.sharedWith) ? file.sharedWith : [])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingShare, setIsLoadingShare] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [expiryDays, setExpiryDays] = useState<string>("never")
  const [linkPermission, setLinkPermission] = useState<'secure-view' | 'full-access'>('full-access')

  // Memoized function to fetch share status - ensures it's called properly
  const fetchShareStatus = useCallback(async () => {
    try {
      setShareError(null)
      const fileId = file?.id || file?._id
      if (!fileId) {
        console.warn('No file ID available')
        setShareError("File ID is missing")
        return
      }

      console.log(`[Share Modal] Calling GET API to fetch share status for file: ${fileId}`)
      
      const response = await fetch(`/api/files/${fileId}/share`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(user?._id && { "x-user-id": user._id }),
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[Share Modal] ✅ API Response received:', data)
        setShareStatus(data)
        setPublicLinkEnabled(data.isPublic || false)
        setLinkPermission(data.publicLinkPermission || 'full-access')
        
        // Set expiry days based on the expiry date
        if (data.publicLinkExpiry) {
          const expiryDate = new Date(data.publicLinkExpiry)
          const now = new Date()
          const diffTime = expiryDate.getTime() - now.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          // If link has expired, disable it
          if (diffDays <= 0) {
            console.log('[Share Modal] Link has expired')
            setExpiryDays('never')
            setPublicLinkEnabled(false)
          } else if (diffDays === 1) {
            setExpiryDays('1')
          } else if (diffDays <= 7) {
            setExpiryDays('7')
          } else if (diffDays <= 30) {
            setExpiryDays('30')
          } else {
            setExpiryDays('never')
          }
        } else {
          setExpiryDays('never')
        }
      } else {
        const error = await response.json()
        console.error('[Share Modal] ❌ API Error:', error)
        setShareError(error.error || 'Failed to load share settings')
      }
    } catch (error) {
      console.error('[Share Modal] ❌ Fetch error:', error)
      setShareError("Failed to load share settings")
    }
  }, [file?.id, file?._id, user?._id])

  // Call API every time modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('[Share Modal] 📂 Modal opened - calling API to get latest status')
      fetchShareStatus()
    }
  }, [isOpen, fetchShareStatus])


  const handleCopyLink = async () => {
    if (!shareStatus?.publicSlug) return
    // Use the publicLink from API or construct it with the current origin
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const link = shareStatus?.publicLink?.startsWith('http') 
      ? shareStatus.publicLink
      : `${baseUrl}${shareStatus?.publicLink || `/shared/${shareStatus?.publicSlug}`}`
    if (link) {
      await navigator.clipboard.writeText(link)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  const handlePublicLinkToggle = async (enabled: boolean) => {
    try {
      setIsLoadingShare(true)
      setShareError(null)

      const fileId = file?.id || file?._id
      if (!fileId) {
        setShareError("File ID is missing")
        setIsLoadingShare(false)
        return
      }

      const response = await fetch(`/api/files/${fileId}/share`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(user?._id && { "x-user-id": user._id }),
        },
        body: JSON.stringify({
          isPublic: enabled,
          expiryDays: expiryDays !== "never" ? expiryDays : undefined,
          permission: linkPermission,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Share toggle response:', data)
        setShareStatus(data)
        setPublicLinkEnabled(data.isPublic) // Use server response, not local state
        setLinkPermission(data.publicLinkPermission || 'full-access')
        
        // Show success message
        if (enabled) {
          console.log('Link sharing enabled successfully')
        } else {
          console.log('Link sharing disabled successfully')
        }
      } else {
        const error = await response.json()
        setShareError(error.error || "Failed to update share settings")
        // Revert toggle if failed
        setPublicLinkEnabled(!enabled)
      }
    } catch (error) {
      console.error("Error updating share status:", error)
      setShareError("Failed to update share settings")
    } finally {
      setIsLoadingShare(false)
    }
  }

  const handleEmailShare = async () => {
    if (!emailInput.trim()) return

    setIsLoading(true)
    setShareError(null)
    
    try {
      const fileId = file?.id || file?._id
      if (!fileId) {
        setShareError("File ID is missing")
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/files', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(user?._id && { 'x-user-id': user._id }),
        },
        body: JSON.stringify({
          action: 'share',
          fileId: fileId,
          data: {
            userEmail: emailInput.trim(),
            permission: permission,
            message: emailMessage.trim() || undefined, // Include message if provided
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('File shared successfully:', data)
        
        // Add user to local shared users list
        setSharedUsers([...sharedUsers, { email: emailInput.trim(), permission }])
        setEmailInput("")
        setEmailMessage("")
        
        // Show success toast
        toast({
          title: "File shared successfully!",
          description: `${file?.fileName || 'File'} has been shared with ${emailInput.trim()}`,
          variant: "default",
        })
      } else {
        const error = await response.json()
        setShareError(error.error || 'Failed to share file')
        toast({
          title: "Failed to share file",
          description: error.error || 'An error occurred while sharing the file',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error sharing file:', error)
      setShareError('Failed to share file')
      toast({
        title: "Error",
        description: 'Failed to share file. Please try again.',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveUser = (userEmail: string) => {
    setSharedUsers(sharedUsers.filter((user: any) => {
      const email = typeof user === 'string' ? user : user.email
      return email !== userEmail
    }))
  }

  const handleSaveChanges = async () => {
    if (!publicLinkEnabled) {
      onClose()
      return
    }

    try {
      setIsLoadingShare(true)
      setShareError(null)

      const fileId = file?.id || file?._id
      if (!fileId) {
        setShareError("File ID is missing")
        setIsLoadingShare(false)
        return
      }

      const response = await fetch(`/api/files/${fileId}/share`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(user?._id && { "x-user-id": user._id }),
        },
        body: JSON.stringify({
          isPublic: publicLinkEnabled,
          expiryDays: expiryDays !== "never" ? expiryDays : undefined,
          permission: linkPermission,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setShareStatus(data)
        setLinkPermission(data.publicLinkPermission || 'full-access')
        onClose()
      } else {
        const error = await response.json()
        setShareError(error.error || "Failed to update share settings")
      }
    } catch (error) {
      console.error("Error updating share settings:", error)
      setShareError("Failed to update share settings")
    } finally {
      setIsLoadingShare(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="text-2xl">{file?.icon || "📄"}</div>
            Share "{file?.name || file?.fileName || 'Untitled'}"
          </DialogTitle>
          <DialogDescription>Control who can access this file and how they can interact with it.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="share" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Share with People
              </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
              <Link className="h-4 w-4" />
              Public Link
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-4 mt-4">
            {/* Email Sharing */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Share with specific people</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={permission} onValueChange={setPermission}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </div>
                      </SelectItem>
                      <SelectItem value="edit">
                        <div className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Edit
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Add a message (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message..."
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={handleEmailShare} disabled={!emailInput.trim() || isLoading} className="w-full gap-2">
                <Send className="h-4 w-4" />
                {isLoading ? "Sending..." : "Send Invitation"}
              </Button>
            </div>

            <Separator />

            {/* Current Shares */}
            <div className="space-y-3">
              <Label>People with access</Label>
              <ScrollArea className="h-40">
                <div className="space-y-2">
                  {/* Owner */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profilePicture} />
                        <AvatarFallback>
                          {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{file.owner || `${user?.firstName} ${user?.lastName}` || 'You'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email || 'Owner'}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Owner</Badge>
                  </div>

                  {/* Shared Users */}
                  {Array.isArray(sharedUsers) && sharedUsers.map((sharedUser: any) => {
                    const email = typeof sharedUser === 'string' ? sharedUser : (sharedUser.email || sharedUser.userEmail)
                    const userName = typeof sharedUser === 'string' ? email.split('@')[0] : (sharedUser.name || sharedUser.userName || email.split('@')[0])
                    const userPermission = typeof sharedUser === 'string' ? 'view' : (sharedUser.permission || 'view')
                    
                    return (
                      <div key={email} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{userName}</p>
                            <p className="text-xs text-muted-foreground truncate">{email}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveUser(email)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}

                  {Array.isArray(sharedUsers) && sharedUsers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No one else has access yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4 mt-4">
            {shareError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{shareError}</AlertDescription>
              </Alert>
            )}

            {/* Public Link Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <Label>Public link sharing</Label>
                </div>
                <p className="text-sm text-muted-foreground">Anyone with the link can view this file</p>
              </div>
              <Switch
                checked={publicLinkEnabled}
                onCheckedChange={handlePublicLinkToggle}
                disabled={isLoadingShare}
              />
            </div>

            {publicLinkEnabled && shareStatus?.publicSlug && (
              <div className="space-y-4">
                {/* Link Display */}
                <div className="space-y-2">
                  <Label>Share this link</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={(() => {
                        if (!shareStatus?.publicSlug) return ""
                        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                        const link = shareStatus?.publicLink?.startsWith('http') 
                          ? shareStatus.publicLink
                          : `${baseUrl}${shareStatus?.publicLink || `/shared/${shareStatus?.publicSlug}`}`
                        return link
                      })()}
                      readOnly
                      className="flex-1 font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                      className="shrink-0 bg-transparent"
                      disabled={isLoadingShare}
                    >
                      {linkCopied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {linkCopied && <p className="text-sm text-success">Link copied to clipboard!</p>}
                </div>

                {/* Link Settings */}
                <div className="space-y-3">
                  <Label>Link permissions</Label>
                  <Select value={linkPermission} onValueChange={(value) => setLinkPermission(value as 'secure-view' | 'full-access')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-access">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <div>
                            <p className="font-medium">Full Access</p>
                            <p className="text-xs text-muted-foreground">Can view, download, and screenshot</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="secure-view">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <div>
                            <p className="font-medium">Secure View Only</p>
                            <p className="text-xs text-muted-foreground">View only - download and screenshot blocked</p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Link Expiration */}
                <div className="space-y-2">
                  <Label>Link expiration</Label>
                  <Select value={expiryDays} onValueChange={setExpiryDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never expires</SelectItem>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">1 week</SelectItem>
                      <SelectItem value="30">1 month</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Expiration Info */}
                  {shareStatus?.publicLinkExpiry && (
                    <div className="mt-3 p-3 bg-muted rounded-md space-y-2">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Expires on:</span> {new Date(shareStatus.publicLinkExpiry).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Status:</span> <span className="text-green-600 font-medium">Active until expiration</span>
                      </p>
                    </div>
                  )}
                  
                  {!shareStatus?.publicLinkExpiry && expiryDays === 'never' && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Status:</span> <span className="text-blue-600 font-medium">Never expires</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!publicLinkEnabled && (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Public link sharing is disabled</p>
                <p className="text-xs">Enable it to share with anyone</p>
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-0">
            <ScrollArea className="h-[500px] pr-4">
              {user?._id && (file?.id || file?._id) ? (
                <AnalyticsView fileId={file?.id || file?._id} userId={user._id} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Unable to load analytics data</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleSaveChanges} disabled={isLoadingShare}>
            {isLoadingShare ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
