// app/profile/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Calendar, 
  Edit, 
  Save, 
  X,
  CheckCircle,
  Clock,
  Target,
  Settings,
  Bell,
  Shield,
  AlertTriangle,
  Upload,
  Camera,
  Key,
  Smartphone,
  Globe,
  MapPin,
  Trash2,
  Plus,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  status: string
  createdAt: string
  updatedAt: string
  bio?: string
  location?: string
  website?: string
  timezone?: string
}

interface UserStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  projectsCount: number
  teamsCount: number
}

interface ActivityItem {
  id: string
  action: string
  target: string
  timestamp: string
  project?: string
}

interface NotificationSetting {
  id: string
  name: string
  description: string
  enabled: boolean
}

interface ConnectedAccount {
  id: string
  provider: string
  email: string
  connected: boolean
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([])
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    location: "",
    website: "",
    timezone: ""
  })

  useEffect(() => {
    fetchUserProfile()
    fetchUserStats()
    fetchRecentActivity()
    fetchNotificationSettings()
    fetchConnectedAccounts()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/users/profile")
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch profile: ${response.status}`)
      }
      
      const userData = await response.json()
      setUser(userData)
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        bio: userData.bio || "",
        location: userData.location || "",
        website: userData.website || "",
        timezone: userData.timezone || ""
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError(error instanceof Error ? error.message : "Failed to load profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await fetch("/api/users/stats")
      if (response.ok) {
        const statsData = await response.json()
        setUserStats(statsData)
      }
    } catch (error) {
      console.error("Error fetching user stats:", error)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch("/api/users/activity")
      if (response.ok) {
        const activityData = await response.json()
        setRecentActivity(activityData || [])
      }
    } catch (error) {
      console.error("Error fetching recent activity:", error)
    }
  }

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch("/api/users/notification-settings")
      if (response.ok) {
        const settingsData = await response.json()
        setNotificationSettings(settingsData || [])
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error)
    }
  }

  const fetchConnectedAccounts = async () => {
    try {
      const response = await fetch("/api/users/connected-accounts")
      if (response.ok) {
        const accountsData = await response.json()
        setConnectedAccounts(accountsData || [])
      }
    } catch (error) {
      console.error("Error fetching connected accounts:", error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update profile")
      }
      
      const updatedUser = await response.json()
      setUser(updatedUser)
      
      // Update session if name changed
      if (session && session.user && formData.name !== session.user.name) {
        await update({
          ...session,
          user: {
            ...session.user,
            name: formData.name,
          }
        })
      }
      
      setIsEditing(false)
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        timezone: user.timezone || ""
      })
    }
    setIsEditing(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      setAvatarUploading(true)
      
      const formData = new FormData()
      formData.append("avatar", file)
      
      const response = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload avatar")
      }
      
      const data = await response.json()
      
      if (user) {
        setUser({
          ...user,
          avatar: data.avatarUrl,
        })
      }
      
      // Update session if avatar changed
      if (session && session.user) {
        await update({
          ...session,
          user: {
            ...session.user,
            image: data.avatarUrl,
          }
        })
      }
      
      toast.success("Avatar updated successfully")
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload avatar")
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleNotificationSettingChange = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch("/api/users/notification-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, enabled }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update notification settings")
      }
      
      setNotificationSettings(prev => 
        prev.map(setting => 
          setting.id === id ? { ...setting, enabled } : setting
        )
      )
      
      toast.success("Notification settings updated")
    } catch (error) {
      console.error("Error updating notification settings:", error)
      toast.error("Failed to update notification settings")
    }
  }

  const handleDisconnectAccount = async (id: string) => {
    try {
      const response = await fetch(`/api/users/connected-accounts/${id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to disconnect account")
      }
      
      setConnectedAccounts(prev => 
        prev.map(account => 
          account.id === id ? { ...account, connected: false } : account
        )
      )
      
      toast.success("Account disconnected successfully")
    } catch (error) {
      console.error("Error disconnecting account:", error)
      toast.error("Failed to disconnect account")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "INACTIVE": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      case "SUSPENDED": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "MANAGER": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "AGENT": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return formatDate(dateString)
  }

  const stats = [
    {
      title: "Tasks Completed",
      value: userStats?.completedTasks?.toString() || "0",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "In Progress",
      value: userStats?.inProgressTasks?.toString() || "0",
      icon: Clock,
      color: "text-blue-600",
    },
    {
      title: "Projects",
      value: userStats?.projectsCount?.toString() || "0",
      icon: Target,
      color: "text-purple-600",
    },
    {
      title: "Teams",
      value: userStats?.teamsCount?.toString() || "0",
      icon: User,
      color: "text-orange-600",
    },
  ]

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
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchUserProfile}>Retry</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">User not found</h2>
            <p className="text-muted-foreground mb-4">Please try logging in again.</p>
            <Button onClick={() => window.location.href = "/api/auth/signin"}>
              Sign In
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              Manage your profile and account settings
            </p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                {/* Profile Information */}
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information and profile details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Avatar Section */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="relative">
                          <Avatar className="h-24 w-24">
                            <AvatarImage src={user.avatar || ""} />
                            <AvatarFallback className="text-2xl">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors">
                            <Camera className="h-4 w-4" />
                            <span className="sr-only">Upload avatar</span>
                          </label>
                          <input
                            id="avatar-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={avatarUploading}
                          />
                          {avatarUploading && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <h3 className="text-xl font-semibold">{user.name}</h3>
                            <Badge className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                            <Badge className={getRoleColor(user.role)}>
                              {user.role}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{user.email}</p>
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button variant="outline" size="sm" asChild>
                              <label htmlFor="avatar-upload" className="cursor-pointer">
                                Change Avatar
                              </label>
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => handleInputChange("bio", e.target.value)}
                          disabled={!isEditing}
                          rows={3}
                          className="mt-1"
                          placeholder="Tell us a bit about yourself..."
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <div className="relative mt-1">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="location"
                              value={formData.location}
                              onChange={(e) => handleInputChange("location", e.target.value)}
                              disabled={!isEditing}
                              className="pl-10"
                              placeholder="City, Country"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="website">Website</Label>
                          <div className="relative mt-1">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="website"
                              type="url"
                              value={formData.website}
                              onChange={(e) => handleInputChange("website", e.target.value)}
                              disabled={!isEditing}
                              className="pl-10"
                              placeholder="https://yourwebsite.com"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <div className="relative mt-1">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="timezone"
                            value={formData.timezone}
                            onChange={(e) => handleInputChange("timezone", e.target.value)}
                            disabled={!isEditing}
                            className="pl-10"
                            placeholder="UTC-8"
                          />
                        </div>
                      </div>
                      
                      {isEditing && (
                        <div className="flex gap-2 pt-2">
                          <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                              </>
                            )}
                          </Button>
                          <Button variant="outline" onClick={handleCancel}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {stats.map((stat) => (
                    <Card key={stat.title} className="border-none shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {stat.title}
                            </p>
                            <p className="text-2xl font-bold">{stat.value}</p>
                          </div>
                          <stat.icon className={`h-8 w-8 ${stat.color}`} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="space-y-6">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Your recent actions and contributions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-medium">{activity.action}</span> {activity.target}
                                {activity.project && (
                                  <span className="text-muted-foreground"> in {activity.project}</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatRelativeTime(activity.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No recent activity</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-6">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Account Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your account preferences and security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Notification Settings</h3>
                      {notificationSettings.map((setting) => (
                        <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium">{setting.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {setting.description}
                            </p>
                          </div>
                          <Switch
                            checked={setting.enabled}
                            onCheckedChange={(checked) => handleNotificationSettingChange(setting.id, checked)}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Security</h3>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Key className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Change Password</p>
                            <p className="text-sm text-muted-foreground">
                              Update your account password
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Change
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-muted-foreground">
                              Add an extra layer of security to your account
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Enable
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Connected Accounts</h3>
                      {connectedAccounts.map((account) => (
                        <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <span className="font-medium">{account.provider.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-medium">{account.provider}</p>
                              <p className="text-sm text-muted-foreground">{account.email}</p>
                            </div>
                          </div>
                          {account.connected ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDisconnectAccount(account.id)}
                            >
                              Disconnect
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm">
                              Connect
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Joined {formatDate(user.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Role: {user.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Last active: 2 hours ago</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Skills */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                  <Badge variant="secondary">Node.js</Badge>
                  <Badge variant="secondary">Python</Badge>
                  <Badge variant="secondary">UI/UX Design</Badge>
                  <Badge variant="secondary">Project Management</Badge>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Connected Accounts */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {connectedAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">{account.provider.charAt(0)}</span>
                      </div>
                      <span className="text-sm">{account.provider}</span>
                    </div>
                    <Badge variant={account.connected ? "default" : "secondary"}>
                      {account.connected ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}