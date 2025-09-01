// components/team-invitation-popup.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Check, X, Users, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

interface TeamInvitationPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notification: {
    id: string
    title: string
    message: string
    type: string
    read: boolean
    createdAt: string
    teamId?: string
    inviterName?: string
    teamName?: string
    token?: string
  }
}

export function TeamInvitationPopup({ 
  open, 
  onOpenChange, 
  notification 
}: TeamInvitationPopupProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAccept = async () => {
    if (!notification.teamId || !notification.token) return

    setLoading(true)
    try {
      const response = await fetch(`/api/teams/${notification.teamId}/invite/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: notification.token }),
      })

      if (response.ok) {
        // Close the popup
        onOpenChange(false)
        // Redirect to the team page
        router.push(`/teams/${notification.teamId}`)
      } else {
        const error = await response.json()
        console.error("Error accepting invitation:", error)
      }
    } catch (error) {
      console.error("Error accepting invitation:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!notification.teamId || !notification.token) return

    setLoading(true)
    try {
      // In a real implementation, you would add an API endpoint to reject invitations
      // For now, we'll just mark the notification as read and close the popup
      await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          notificationIds: [notification.id], 
          read: true 
        }),
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error rejecting invitation:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Invitation
          </DialogTitle>
          <DialogDescription>
            You've been invited to join a team
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{notification.teamName}</CardTitle>
              <CardDescription>
                Invited by {notification.inviterName}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Badge variant="outline">Pending</Badge>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-2">
            <p className="text-sm">
              By accepting this invitation, you'll become a member of the team and gain access to its projects and tasks.
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex gap-2 sm:gap-1">
          <Button 
            variant="outline" 
            onClick={handleReject} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Decline
              </>
            )}
          </Button>
          <Button 
            onClick={handleAccept} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Accept
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}