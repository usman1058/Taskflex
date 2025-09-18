// app/organizations/[id]/settings/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Loader2, 
  Settings, 
  Users, 
  Shield, 
  Bell,
  Palette,
  Database,
  Globe,
  AlertTriangle,
  Check,
  Key,
  Copy,
  Building,
  MapPin,
  UserPlus
} from "lucide-react"
import Link from "next/link"
import DeleteOrganizationDialog from "@/components/organizations/delete-organization-dialog"
import InviteMemberDialog from "@/components/organizations/invite-member-dialog"

interface OrganizationMember {
  id: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  role: string
  joinedAt: string
}

interface OrganizationSettings {
  id: string
  organizationId: string
  allowPublicProjects: boolean
  allowPublicTeams: boolean
  allowMemberInvites: boolean
  requireApprovalForJoin: boolean
  defaultMemberRole: string
  notificationSettings: {
    newMember: boolean
    projectCreated: boolean
    teamCreated: boolean
    taskAssigned: boolean
    taskCompleted: boolean
    commentAdded: boolean
  }
}

interface Organization {
  id: string
  name: string
  description: string | null
  type: string
  industry: string | null
  size: string | null
  website: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postalCode: string | null
  timezone: string | null
  adminKey: string | null
  createdAt: string
  updatedAt: string
  members: OrganizationMember[]
}

export default function OrganizationSettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [settings, setSettings] = useState<OrganizationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("general")
  const [adminKey, setAdminKey] = useState<string | null>(null)
  const [showAdminKey, setShowAdminKey] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "COMPANY",
    industry: "",
    size: "",
    website: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    timezone: ""
  })
  const [settingsData, setSettingsData] = useState({
    allowPublicProjects: false,
    allowPublicTeams: false,
    allowMemberInvites: true,
    requireApprovalForJoin: false,
    defaultMemberRole: "MEMBER",
    notificationSettings: {
      newMember: true,
      projectCreated: true,
      teamCreated: true,
      taskAssigned: true,
      taskCompleted: true,
      commentAdded: true
    }
  })
  
  useEffect(() => {
    if (id) {
      fetchOrganization()
      fetchSettings()
    }
  }, [id])
  
  const fetchOrganization = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/organizations/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Organization not found")
        } else if (response.status === 403) {
          setError("Access denied")
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to fetch organization: ${response.status}`)
        }
        return
      }
      
      const organizationData = await response.json()
      setOrganization(organizationData)
      setAdminKey(organizationData.adminKey)
      setFormData({
        name: organizationData.name,
        description: organizationData.description || "",
        type: organizationData.type || "COMPANY",
        industry: organizationData.industry || "",
        size: organizationData.size || "",
        website: organizationData.website || "",
        phone: organizationData.phone || "",
        address: organizationData.address || "",
        city: organizationData.city || "",
        state: organizationData.state || "",
        country: organizationData.country || "",
        postalCode: organizationData.postalCode || "",
        timezone: organizationData.timezone || ""
      })
    } catch (error) {
      console.error("Error fetching organization:", error)
      setError(error instanceof Error ? error.message : "Failed to load organization. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/organizations/${id}/settings`)
      
      if (response.ok) {
        const settingsData = await response.json()
        setSettings(settingsData)
        setSettingsData({
          allowPublicProjects: settingsData.allowPublicProjects,
          allowPublicTeams: settingsData.allowPublicTeams,
          allowMemberInvites: settingsData.allowMemberInvites,
          requireApprovalForJoin: settingsData.requireApprovalForJoin,
          defaultMemberRole: settingsData.defaultMemberRole,
          notificationSettings: settingsData.notificationSettings
        })
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }
  
  const handleSaveOrganization = async () => {
    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch(`/api/organizations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update organization")
      }
      
      const updatedOrganization = await response.json()
      setOrganization(updatedOrganization)
      
      // Show success message
      const successMessage = document.createElement("div")
      successMessage.className = "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center"
      successMessage.innerHTML = '<Check className="mr-2 h-4 w-4" />Organization updated successfully'
      document.body.appendChild(successMessage)
      
      setTimeout(() => {
        document.body.removeChild(successMessage)
      }, 3000)
    } catch (error) {
      console.error("Error updating organization:", error)
      setError(error instanceof Error ? error.message : "Failed to update organization")
    } finally {
      setSaving(false)
    }
  }
  
  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch(`/api/organizations/${id}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settingsData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update settings")
      }
      
      const updatedSettings = await response.json()
      setSettings(updatedSettings)
      
      // Show success message
      const successMessage = document.createElement("div")
      successMessage.className = "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center"
      successMessage.innerHTML = '<Check className="mr-2 h-4 w-4" />Settings updated successfully'
      document.body.appendChild(successMessage)
      
      setTimeout(() => {
        document.body.removeChild(successMessage)
      }, 3000)
    } catch (error) {
      console.error("Error updating settings:", error)
      setError(error instanceof Error ? error.message : "Failed to update settings")
    } finally {
      setSaving(false)
    }
  }
  
  const handleRegenerateKey = async () => {
    try {
      const response = await fetch(`/api/organizations/${id}/regenerate-key`, {
        method: "POST"
      })
      
      if (response.ok) {
        const data = await response.json()
        setAdminKey(data.adminKey)
        setShowAdminKey(true)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to regenerate admin key")
      }
    } catch (error) {
      console.error("Error regenerating admin key:", error)
      alert("Failed to regenerate admin key")
    }
  }
  
  const copyToClipboard = () => {
    if (adminKey) {
      navigator.clipboard.writeText(adminKey)
      alert("Admin key copied to clipboard!")
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSettingsChange = (field: string, value: any) => {
    setSettingsData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        return {
          ...prev,
          [parent]: {
            ...prev[parent as any],
            [child]: value
          }
        }
      } else {
        return {
          ...prev,
          [field]: value
        }
      }
    })
  }
  
  const getUserRole = () => {
    if (!organization || !session?.user?.id) return null
    
    const member = organization.members.find(m => m.user.id === session.user.id)
    return member ? member.role : null
  }
  
  const userRole = getUserRole()
  const isAdmin = session?.user?.role === "ADMIN"
  const canEdit = isAdmin || (userRole && (userRole === "OWNER" || userRole === "ADMIN"))
  const canDelete = isAdmin || (userRole === "OWNER")
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    )
  }
  
  if (error || !organization) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error || "Organization not found"}</p>
            <Button asChild>
              <Link href="/organizations">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Organizations
              </Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }
  
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/organizations/${id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Organization Settings</h1>
              <p className="text-muted-foreground">
                {organization.name}
              </p>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive">{error}</p>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Organization Information
                </CardTitle>
                <CardDescription>
                  Update your organization's basic information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    disabled={!canEdit}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="type">Organization Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => handleSelectChange("type", value)}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMPANY">Company</SelectItem>
                        <SelectItem value="NONPROFIT">Nonprofit</SelectItem>
                        <SelectItem value="EDUCATIONAL">Educational</SelectItem>
                        <SelectItem value="GOVERNMENT">Government</SelectItem>
                        <SelectItem value="STARTUP">Startup</SelectItem>
                        <SelectItem value="FREELANCE">Freelance</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="size">Organization Size</Label>
                  <Select 
                    value={formData.size} 
                    onValueChange={(value) => handleSelectChange("size", value)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOLO">Solo (1 person)</SelectItem>
                      <SelectItem value="SMALL">Small (2-50 employees)</SelectItem>
                      <SelectItem value="MEDIUM">Medium (51-500 employees)</SelectItem>
                      <SelectItem value="LARGE">Large (501-5000 employees)</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise (5000+ employees)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleInputChange}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={formData.timezone} 
                    onValueChange={(value) => handleSelectChange("timezone", value)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">GMT (London)</SelectItem>
                      <SelectItem value="Europe/Paris">CET (Paris)</SelectItem>
                      <SelectItem value="Asia/Tokyo">JST (Tokyo)</SelectItem>
                      <SelectItem value="Australia/Sydney">AEST (Sydney)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveOrganization} 
                    disabled={saving || !canEdit}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Organization Permissions
                </CardTitle>
                <CardDescription>
                  Configure permissions and access controls for your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="public-projects" className="text-base">
                        Public Projects
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow anyone to view projects in this organization
                      </p>
                    </div>
                    <Switch
                      id="public-projects"
                      checked={settingsData.allowPublicProjects}
                      onCheckedChange={(checked) => handleSettingsChange("allowPublicProjects", checked)}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="public-teams" className="text-base">
                        Public Teams
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow anyone to view teams in this organization
                      </p>
                    </div>
                    <Switch
                      id="public-teams"
                      checked={settingsData.allowPublicTeams}
                      onCheckedChange={(checked) => handleSettingsChange("allowPublicTeams", checked)}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="member-invites" className="text-base">
                        Member Invites
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow members to invite others to the organization
                      </p>
                    </div>
                    <Switch
                      id="member-invites"
                      checked={settingsData.allowMemberInvites}
                      onCheckedChange={(checked) => handleSettingsChange("allowMemberInvites", checked)}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="require-approval" className="text-base">
                        Require Approval
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Require approval for new members to join
                      </p>
                    </div>
                    <Switch
                      id="require-approval"
                      checked={settingsData.requireApprovalForJoin}
                      onCheckedChange={(checked) => handleSettingsChange("requireApprovalForJoin", checked)}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="default-role">Default Member Role</Label>
                    <Select 
                      value={settingsData.defaultMemberRole} 
                      onValueChange={(value) => handleSettingsChange("defaultMemberRole", value)}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OWNER">Owner</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="MEMBER">Member</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      This role will be assigned to new members when they join
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSettings} 
                    disabled={saving || !canEdit}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure which notifications are sent to organization members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="new-member" className="text-base">
                        New Member Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Notify members when someone new joins the organization
                      </p>
                    </div>
                    <Switch
                      id="new-member"
                      checked={settingsData.notificationSettings.newMember}
                      onCheckedChange={(checked) => handleSettingsChange("notificationSettings.newMember", checked)}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="project-created" className="text-base">
                        Project Created Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Notify members when a new project is created
                      </p>
                    </div>
                    <Switch
                      id="project-created"
                      checked={settingsData.notificationSettings.projectCreated}
                      onCheckedChange={(checked) => handleSettingsChange("notificationSettings.projectCreated", checked)}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="team-created" className="text-base">
                        Team Created Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Notify members when a new team is created
                      </p>
                    </div>
                    <Switch
                      id="team-created"
                      checked={settingsData.notificationSettings.teamCreated}
                      onCheckedChange={(checked) => handleSettingsChange("notificationSettings.teamCreated", checked)}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="task-assigned" className="text-base">
                        Task Assigned Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Notify members when they are assigned to a task
                      </p>
                    </div>
                    <Switch
                      id="task-assigned"
                      checked={settingsData.notificationSettings.taskAssigned}
                      onCheckedChange={(checked) => handleSettingsChange("notificationSettings.taskAssigned", checked)}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="task-completed" className="text-base">
                        Task Completed Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Notify members when a task is completed
                      </p>
                    </div>
                    <Switch
                      id="task-completed"
                      checked={settingsData.notificationSettings.taskCompleted}
                      onCheckedChange={(checked) => handleSettingsChange("notificationSettings.taskCompleted", checked)}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="comment-added" className="text-base">
                        Comment Added Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Notify members when a comment is added to a task
                      </p>
                    </div>
                    <Switch
                      id="comment-added"
                      checked={settingsData.notificationSettings.commentAdded}
                      onCheckedChange={(checked) => handleSettingsChange("notificationSettings.commentAdded", checked)}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSettings} 
                    disabled={saving || !canEdit}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Organization Members
                </CardTitle>
                <CardDescription>
                  Manage who has access to your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <InviteMemberDialog organization={organization}>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Member
                    </Button>
                  </InviteMemberDialog>
                  
                  <div className="space-y-3">
                    {organization.members.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.user.avatar} />
                            <AvatarFallback>
                              {member.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.user.name}</p>
                            <p className="text-sm text-muted-foreground">{member.user.email}</p>
                          </div>
                        </div>
                        <Badge className={
                          member.role === "OWNER" ? "bg-purple-100 text-purple-800" :
                          member.role === "ADMIN" ? "bg-blue-100 text-blue-800" :
                          member.role === "MANAGER" ? "bg-green-100 text-green-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Admin Key
                </CardTitle>
                <CardDescription>
                  This key is used for administrative actions. Keep it secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="adminKey">Admin Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="adminKey"
                      type={showAdminKey ? "text" : "password"}
                      value={adminKey || ""}
                      readOnly
                      className="font-mono"
                    />
                    <Button variant="outline" onClick={() => setShowAdminKey(!showAdminKey)}>
                      {showAdminKey ? "Hide" : "Show"}
                    </Button>
                    <Button variant="outline" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    This key is required for critical operations like deleting the organization.
                  </p>
                </div>
                <Button onClick={handleRegenerateKey}>
                  Regenerate Key
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="danger" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  These actions are irreversible. Please proceed with caution.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Delete Organization</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this organization and all of its associated data, including projects, teams, and tasks. This action cannot be undone.
                  </p>
                </div>
                
                {canDelete && (
                  <DeleteOrganizationDialog 
                    organization={organization} 
                    onSuccess={() => router.push("/organizations")}
                  >
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Organization
                    </Button>
                  </DeleteOrganizationDialog>
                )}
                
                {!canDelete && (
                  <p className="text-sm text-muted-foreground">
                    You don't have permission to delete this organization.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}