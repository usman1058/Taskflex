"use client"

import { useState } from "react"
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
  Shield
} from "lucide-react"

export default function ProfilePage() {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    bio: "Passionate developer and team player with 5+ years of experience in web development.",
    location: "San Francisco, CA",
    website: "https://example.com",
    timezone: "UTC-8"
  })

  // Mock data for statistics
  const stats = [
    {
      title: "Tasks Completed",
      value: "47",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "In Progress",
      value: "8",
      icon: Clock,
      color: "text-blue-600",
    },
    {
      title: "Projects",
      value: "12",
      icon: Target,
      color: "text-purple-600",
    },
    {
      title: "Team Members",
      value: "24",
      icon: User,
      color: "text-orange-600",
    },
  ]

  // Mock recent activity
  const recentActivity = [
    {
      id: "1",
      action: "completed task",
      target: "Update user interface design",
      time: "2 hours ago",
    },
    {
      id: "2",
      action: "commented on",
      target: "API integration project",
      time: "5 hours ago",
    },
    {
      id: "3",
      action: "created task",
      target: "Database optimization",
      time: "1 day ago",
    },
    {
      id: "4",
      action: "updated status",
      target: "Mobile app development",
      time: "2 days ago",
    },
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    // In a real app, this would call an API
    console.log("Saving profile:", formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      name: session?.user?.name || "",
      email: session?.user?.email || "",
      bio: "Passionate developer and team player with 5+ years of experience in web development.",
      location: "San Francisco, CA",
      website: "https://example.com",
      timezone: "UTC-8"
    })
    setIsEditing(false)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Profile Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information and profile details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Avatar Section */}
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={session?.user?.avatar || ""} />
                          <AvatarFallback className="text-lg">
                            {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-semibold">{session?.user?.name}</h3>
                          <p className="text-muted-foreground">{session?.user?.email}</p>
                          <Button variant="outline" size="sm" className="mt-2">
                            Change Avatar
                          </Button>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            disabled={!isEditing}
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
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => handleInputChange("location", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            type="url"
                            value={formData.website}
                            onChange={(e) => handleInputChange("website", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Input
                          id="timezone"
                          value={formData.timezone}
                          onChange={(e) => handleInputChange("timezone", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>

                      {isEditing && (
                        <div className="flex gap-2">
                          <Button onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
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
                    <Card key={stat.title}>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Your recent actions and contributions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium">{activity.action}</span> {activity.target}
                            </p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
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
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-muted-foreground">
                              Receive email updates about your tasks
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Bell className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Push Notifications</p>
                            <p className="text-sm text-muted-foreground">
                              Get real-time notifications in your browser
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Configure
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
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Joined January 2024</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Role: {session?.user?.role || "User"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Last active: 2 hours ago</span>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
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
                </div>
              </CardContent>
            </Card>

            {/* Connected Accounts */}
            <Card>
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">G</span>
                    </div>
                    <span className="text-sm">GitHub</span>
                  </div>
                  <Badge variant="secondary">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">G</span>
                    </div>
                    <span className="text-sm">Google</span>
                  </div>
                  <Badge variant="secondary">Connected</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}