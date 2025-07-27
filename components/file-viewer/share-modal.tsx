"use client"

import { useState } from "react"
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
import { Globe, Copy, Check, X, Eye, Edit, UserPlus, Link, Send } from "lucide-react"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  file: any
}

export function ShareModal({ isOpen, onClose, file }: ShareModalProps) {
  const [publicLinkEnabled, setPublicLinkEnabled] = useState(!!file.publicLink)
  const [linkCopied, setLinkCopied] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [permission, setPermission] = useState("view")
  const [sharedUsers, setSharedUsers] = useState(file.sharedWith || [])
  const [isLoading, setIsLoading] = useState(false)

  const handleCopyLink = async () => {
    const link = file.publicLink || `https://dropdrive.com/view/file/${file.id}`
    await navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleEmailShare = async () => {
    if (!emailInput.trim()) return

    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setSharedUsers([...sharedUsers, emailInput])
      setEmailInput("")
      setEmailMessage("")
      setIsLoading(false)
    }, 1000)
  }

  const handleRemoveUser = (email: string) => {
    setSharedUsers(sharedUsers.filter((user: string) => user !== email))
  }

  const handlePublicLinkToggle = (enabled: boolean) => {
    setPublicLinkEnabled(enabled)
    // In a real app, you'd update this on the server
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="text-2xl">{file.icon}</div>
            Share "{file.name}"
          </DialogTitle>
          <DialogDescription>Control who can access this file and how they can interact with it.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Share with People
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
              <Link className="h-4 w-4" />
              Public Link
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
                        <AvatarImage src="/placeholder.svg?height=32&width=32" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{file.owner}</p>
                        <p className="text-xs text-muted-foreground">john.doe@example.com</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Owner</Badge>
                  </div>

                  {/* Shared Users */}
                  {sharedUsers.map((email: string) => (
                    <div key={email} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{email[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{email}</p>
                          <p className="text-xs text-muted-foreground">Can view</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveUser(email)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {sharedUsers.length === 0 && (
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
            {/* Public Link Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <Label>Public link sharing</Label>
                </div>
                <p className="text-sm text-muted-foreground">Anyone with the link can view this file</p>
              </div>
              <Switch checked={publicLinkEnabled} onCheckedChange={handlePublicLinkToggle} />
            </div>

            {publicLinkEnabled && (
              <div className="space-y-4">
                {/* Link Display */}
                <div className="space-y-2">
                  <Label>Share this link</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={file.publicLink || `https://dropdrive.com/view/file/${file.id}`}
                      readOnly
                      className="flex-1 font-mono text-sm"
                    />
                    <Button variant="outline" size="icon" onClick={handleCopyLink} className="shrink-0 bg-transparent">
                      {linkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  {linkCopied && <p className="text-sm text-green-600">Link copied to clipboard!</p>}
                </div>

                {/* Link Settings */}
                <div className="space-y-3">
                  <Label>Link permissions</Label>
                  <Select defaultValue="view">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <div>
                            <p>View only</p>
                            <p className="text-xs text-muted-foreground">Can view and download</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="edit">
                        <div className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          <div>
                            <p>Can edit</p>
                            <p className="text-xs text-muted-foreground">Can view, download, and edit</p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Link Expiration */}
                <div className="space-y-2">
                  <Label>Link expiration</Label>
                  <Select defaultValue="never">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never expires</SelectItem>
                      <SelectItem value="1day">1 day</SelectItem>
                      <SelectItem value="1week">1 week</SelectItem>
                      <SelectItem value="1month">1 month</SelectItem>
                    </SelectContent>
                  </Select>
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
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
