// app/notifications/page.tsx
"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, CheckCheck, X, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

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
      setError("Failed to load notifications. Please try again.")
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
      alert("Failed to update notifications. Please try again.")
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

  const markAsReadOrUnread = (notificationId: string, currentReadStatus: boolean) => {
    markAsRead([notificationId], !currentReadStatus)
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.status}`)
      }

      // Update the local state
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      )
    } catch (error) {
      console.error("Error deleting notification:", error)
      alert("Failed to delete notification. Please try again.")
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return <div className="p-2 rounded-full bg-blue-100 text-blue-600">📋</div>
      case "TASK_UPDATED":
        return <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">✏️</div>
      case "TASK_COMPLETED":
        return <div className="p-2 rounded-full bg-green-100 text-green-600">✅</div>
      case "COMMENT_ADDED":
        return <div className="p-2 rounded-full bg-purple-100 text-purple-600">💬</div>
      case "MENTION":
        return <div className="p-2 rounded-full bg-pink-100 text-pink-600">🔔</div>
      case "TEAM_INVITATION":
        return <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">👥</div>
      default:
        return <div className="p-2 rounded-full bg-gray-100 text-gray-600">🔔</div>
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-destructive text-lg mb-4">{error}</p>
            <Button onClick={fetchNotifications}>Try Again</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your task assignments and team activities
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} unread
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Your latest updates and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No new notifications</p>
                <p className="text-sm text-muted-foreground mt-2">
                  You'll see notifications here when tasks are assigned to you or when there are updates.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border flex items-start gap-4 ${
                      notification.read ? "bg-background" : "bg-muted/50"
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{notification.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsReadOrUnread(notification.id, notification.read)}
                          >
                            {notification.read ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}