// components/layout/notification-bell.tsx (Updated)
"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Bell, Check, X, Users, ExternalLink, Calendar, Users as UsersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import TeamInvitationPopup from "@/components/team-invitation-popup"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
  link?: string // Added link field
  // Additional fields for team invitations
  teamId?: string
  inviterName?: string
  teamName?: string
  token?: string
  data?: any
}

export function NotificationBell() {
  const { data: session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selectedInvitation, setSelectedInvitation] = useState<Notification | null>(null)
  
  useEffect(() => {
    if (session) {
      fetchNotifications()
    }
  }, [session])
  
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/notifications")
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`)
      }
      const data = await response.json()
      setNotifications(data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const markAsRead = async (notificationIds: string[], read: boolean) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds, read }),
      })
      if (!response.ok) {
        throw new Error(`Failed to update notifications: ${response.status}`)
      }
      // Update the local state
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, read }
            : notification
        )
      )
    } catch (error) {
      console.error("Error updating notifications:", error)
    }
  }
  
  const markAllAsRead = () => {
    const unreadIds = notifications
      .filter(notification => !notification.read)
      .map(notification => notification.id)
    
    if (unreadIds.length > 0) {
      markAsRead(unreadIds, true)
    }
  }
  
  const handleNotificationClick = (notification: Notification) => {
    console.log("Notification clicked:", notification)
    
    // For team invitations, show the popup
    if (notification.type === "TEAM_INVITATION" && notification.token) {
      setSelectedInvitation(notification)
      setOpen(false) // Close the dropdown
      return
    }
    
    // For other notifications, navigate to the link if available
    if (notification.link) {
      console.log("Navigating to:", notification.link)
      router.push(notification.link)
      setOpen(false) // Close the dropdown
      
      // Mark as read when clicked
      if (!notification.read) {
        markAsRead([notification.id], true)
      }
    } else {
      console.log("No link found for notification")
      // If no link, at least mark as read
      if (!notification.read) {
        markAsRead([notification.id], true)
      }
    }
  }
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return <div className="p-1 rounded-full bg-blue-100 text-blue-600 text-xs">📋</div>
      case "TASK_UPDATED":
        return <div className="p-1 rounded-full bg-yellow-100 text-yellow-600 text-xs">✏️</div>
      case "TASK_COMPLETED":
        return <div className="p-1 rounded-full bg-green-100 text-green-600 text-xs">✅</div>
      case "COMMENT_ADDED":
        return <div className="p-1 rounded-full bg-purple-100 text-purple-600 text-xs">💬</div>
      case "MENTION":
        return <div className="p-1 rounded-full bg-pink-100 text-pink-600 text-xs">🔔</div>
      case "TEAM_INVITATION":
        return <div className="p-1 rounded-full bg-indigo-100 text-indigo-600 text-xs">👥</div>
      case "TEAM_MEETING_SCHEDULED":
        return <div className="p-1 rounded-full bg-orange-100 text-orange-600 text-xs">📅</div>
      case "NEW_TEAM_MEMBER":
        return <div className="p-1 rounded-full bg-green-100 text-green-600 text-xs">👥</div>
      default:
        return <div className="p-1 rounded-full bg-gray-100 text-gray-600 text-xs">🔔</div>
    }
  }
  
  const getNotificationBadge = (notification: Notification) => {
    switch (notification.type) {
      case "TEAM_INVITATION":
        return (
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Invitation
          </Badge>
        )
      case "TEAM_MEETING_SCHEDULED":
        return (
          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            Meeting
          </Badge>
        )
      case "NEW_TEAM_MEMBER":
        return (
          <Badge variant="outline" className="text-xs">
            <UsersIcon className="h-3 w-3 mr-1" />
            Team
          </Badge>
        )
      default:
        return null
    }
  }
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  if (!session) {
    return null
  }
  
  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between p-2">
            <h3 className="font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-3 cursor-pointer ${
                    notification.type === "TEAM_INVITATION" ? "hover:bg-muted/70" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3 w-full">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h4 className="font-medium truncate">{notification.title}</h4>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {notification.message}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                        {getNotificationBadge(notification)}
                        {notification.link && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <ExternalLink className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/notifications" className="w-full text-center justify-center">
              View all notifications
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Team Invitation Popup */}
      {selectedInvitation && (
        <TeamInvitationPopup
          open={!!selectedInvitation}
          onOpenChange={(open) => !open && setSelectedInvitation(null)}
          notification={selectedInvitation}
        />
      )}
    </>
  )
}