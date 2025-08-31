"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [notificationLoading, setNotificationLoading] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.slice(0, 5)) // Get only the 5 most recent
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      setNotificationLoading(true)
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds, read: true }),
      })

      if (response.ok) {
        // Update the local state
        setNotifications(prev =>
          prev.map(notification =>
            notificationIds.includes(notification.id)
              ? { ...notification, read: true }
              : notification
          )
        )
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    } finally {
      setNotificationLoading(false)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(notification => !notification.read)
      .map(notification => notification.id)
    
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return <div className="p-1 rounded-full bg-blue-100 text-blue-600">📋</div>
      case "TASK_UPDATED":
        return <div className="p-1 rounded-full bg-yellow-100 text-yellow-600">✏️</div>
      case "TASK_COMPLETED":
        return <div className="p-1 rounded-full bg-green-100 text-green-600">✅</div>
      case "COMMENT_ADDED":
        return <div className="p-1 rounded-full bg-purple-100 text-purple-600">💬</div>
      case "MENTION":
        return <div className="p-1 rounded-full bg-pink-100 text-pink-600">🔔</div>
      case "TEAM_INVITATION":
        return <div className="p-1 rounded-full bg-indigo-100 text-indigo-600">👥</div>
      default:
        return <div className="p-1 rounded-full bg-gray-100 text-gray-600">🔔</div>
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={notificationLoading}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="py-4 px-2 text-center text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex-col items-start p-4 cursor-pointer ${
                  notification.read ? "bg-background" : "bg-muted/30"
                }`}
                onClick={() => !notification.read && markAsRead([notification.id])}
              >
                <div className="flex w-full justify-between">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(notification.type)}
                    <span className="font-medium">{notification.title}</span>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <span className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="text-center justify-center">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <div className="py-4 px-2 text-center text-muted-foreground">
            No notifications
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}