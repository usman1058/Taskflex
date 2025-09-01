// app/settings/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, 
  User, 
  Bell, 
  Monitor, 
  Save, 
  Loader2,
  Shield,
  Key,
  Mail,
  Camera
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  status: string
}

interface NotificationPreferences {
  emailNotifications: boolean
  taskAssigned: boolean
  taskUpdated: boolean
  taskCompleted: boolean
  commentAdded: boolean
  mention: boolean
  teamInvitation: boolean
  system: boolean
}

interface DisplayPreferences {
  theme: "light" | "dark" | "system"
  density: "compact" | "comfortable" | "spacious"
  dateFormat: string
  timeFormat: "12h" | "24h"
}

interface SettingsData {
  user: User
  notificationPreferences: NotificationPreferences
  displayPreferences: DisplayPreferences
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    notificationPreferences: {
      emailNotifications: true,
      taskAssigned: true,
      taskUpdated: true,
      taskCompleted: false,
      commentAdded: true,
      mention: true,
      teamInvitation: true,
      system: true
    } as NotificationPreferences,
    displayPreferences: {
      theme: "system" as const,
      density: "comfortable" as const,
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h" as const
    } as DisplayPreferences
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  // app/settings/page.tsx (updated fetchSettings function)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/settings")
      
      if (!response.ok) {
        if (response.status === 503) {
          setError("Database connection error. Please try again later.")
        } else {
          throw new Error(`Failed to fetch settings: ${response.status}`)
        }
        return
      }
      
      const settingsData = await response.json()
      setSettings(settingsData)
      setFormData({
        name: settingsData.user.name,
        email: settingsData.user.email,
        notificationPreferences: settingsData.notificationPreferences,
        displayPreferences: settingsData.displayPreferences
      })
    } catch (error) {
      console.error("Error fetching settings:", error)
      setError("Failed to load settings. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error(`Failed to update settings: ${response.status}`)
      }

      const updatedSettings = await response.json()
      setSettings(updatedSettings)
    } catch (error) {
      console.error("Error updating settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNotificationChange = (key: keyof NotificationPreferences, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: value
      }
    }))
  }

  const handleDisplayChange = (key: keyof DisplayPreferences, value: string) => {
    setFormData(prev => ({
      ...prev,
      displayPreferences: {
        ...prev.displayPreferences,
        [key]: value
      }
    }))
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and application settings
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-64">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings Menu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 p-0">
                <button
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === "profile" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                  onClick={() => setActiveTab("profile")}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </div>
                </button>
                <button
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === "notifications" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                  onClick={() => setActiveTab("notifications")}
                >
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                  </div>
                </button>
                <button
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === "display" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                  onClick={() => setActiveTab("display")}
                >
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span>Display</span>
                  </div>
                </button>
                <button
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === "security" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                  onClick={() => setActiveTab("security")}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Security</span>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="capitalize">{activeTab} Settings</span>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={settings?.user.avatar} />
                          <AvatarFallback className="text-2xl">
                            {settings?.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <Button size="sm" className="absolute bottom-0 right-0 rounded-full p-1 h-8 w-8">
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-center">
                        <h2 className="text-xl font-bold">{settings?.user.name}</h2>
                        <p className="text-muted-foreground">{settings?.user.email}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="emailNotifications">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive email notifications for important updates
                          </p>
                        </div>
                        <Switch
                          id="emailNotifications"
                          checked={formData.notificationPreferences.emailNotifications}
                          onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Task Notifications</h3>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="taskAssigned">Task Assigned</Label>
                            <p className="text-sm text-muted-foreground">
                              Notify when a task is assigned to you
                            </p>
                          </div>
                          <Switch
                            id="taskAssigned"
                            checked={formData.notificationPreferences.taskAssigned}
                            onCheckedChange={(checked) => handleNotificationChange("taskAssigned", checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="taskUpdated">Task Updated</Label>
                            <p className="text-sm text-muted-foreground">
                              Notify when a task you're involved in is updated
                            </p>
                          </div>
                          <Switch
                            id="taskUpdated"
                            checked={formData.notificationPreferences.taskUpdated}
                            onCheckedChange={(checked) => handleNotificationChange("taskUpdated", checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="taskCompleted">Task Completed</Label>
                            <p className="text-sm text-muted-foreground">
                              Notify when a task you're involved in is completed
                            </p>
                          </div>
                          <Switch
                            id="taskCompleted"
                            checked={formData.notificationPreferences.taskCompleted}
                            onCheckedChange={(checked) => handleNotificationChange("taskCompleted", checked)}
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Other Notifications</h3>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="commentAdded">Comment Added</Label>
                            <p className="text-sm text-muted-foreground">
                              Notify when someone comments on your tasks
                            </p>
                          </div>
                          <Switch
                            id="commentAdded"
                            checked={formData.notificationPreferences.commentAdded}
                            onCheckedChange={(checked) => handleNotificationChange("commentAdded", checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="mention">Mention</Label>
                            <p className="text-sm text-muted-foreground">
                              Notify when someone mentions you
                            </p>
                          </div>
                          <Switch
                            id="mention"
                            checked={formData.notificationPreferences.mention}
                            onCheckedChange={(checked) => handleNotificationChange("mention", checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="teamInvitation">Team Invitation</Label>
                            <p className="text-sm text-muted-foreground">
                              Notify when you're invited to a team
                            </p>
                          </div>
                          <Switch
                            id="teamInvitation"
                            checked={formData.notificationPreferences.teamInvitation}
                            onCheckedChange={(checked) => handleNotificationChange("teamInvitation", checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="system">System</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive important system notifications
                            </p>
                          </div>
                          <Switch
                            id="system"
                            checked={formData.notificationPreferences.system}
                            onCheckedChange={(checked) => handleNotificationChange("system", checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === "display" && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="theme">Theme</Label>
                        <Select 
                          value={formData.displayPreferences.theme} 
                          onValueChange={(value) => handleDisplayChange("theme", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Choose how the application looks to you
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="density">Density</Label>
                        <Select 
                          value={formData.displayPreferences.density} 
                          onValueChange={(value) => handleDisplayChange("density", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compact">Compact</SelectItem>
                            <SelectItem value="comfortable">Comfortable</SelectItem>
                            <SelectItem value="spacious">Spacious</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Control the density of the interface
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dateFormat">Date Format</Label>
                          <Select 
                            value={formData.displayPreferences.dateFormat} 
                            onValueChange={(value) => handleDisplayChange("dateFormat", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="timeFormat">Time Format</Label>
                          <Select 
                            value={formData.displayPreferences.timeFormat} 
                            onValueChange={(value) => handleDisplayChange("timeFormat", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12h">12-hour clock</SelectItem>
                              <SelectItem value="24h">24-hour clock</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === "security" && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Two-Factor Authentication</Label>
                          <p className="text-sm text-muted-foreground">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Button variant="outline">
                          Enable
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Change Password</h3>
                        
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input id="currentPassword" type="password" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input id="newPassword" type="password" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input id="confirmPassword" type="password" />
                        </div>
                        
                        <Button>
                          <Key className="mr-2 h-4 w-4" />
                          Change Password
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Active Sessions</h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">Current Session</p>
                              <p className="text-sm text-muted-foreground">Chrome on Windows • Active now</p>
                            </div>
                            <Badge>Current</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">Chrome on macOS</p>
                              <p className="text-sm text-muted-foreground">San Francisco, CA • 2 days ago</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Revoke
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}