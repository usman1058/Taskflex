// app/organizations/[id]/page.tsx
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  FolderOpen,
  Calendar,
  Settings,
  Users2,
  AlertTriangle,
  Loader2,
  Plus,
  UserPlus,
  Mail,
  Check,
  Activity
} from "lucide-react"
import Link from "next/link"

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

interface OrganizationProject {
  id: string
  name: string
  key: string
  description: string | null
  status: string
  createdAt: string
  _count: {
    tasks: number
    members: number
  }
}

interface OrganizationTeam {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: string
  _count: {
    members: number
    tasks: number
  }
}

interface Organization {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  members: OrganizationMember[]
  projects: OrganizationProject[]
  teams: OrganizationTeam[]
  _count: {
    projects: number
    teams: number
    members: number
  }
}

export default function OrganizationDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedRole, setSelectedRole] = useState("MEMBER")
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })

  useEffect(() => {
    if (id) {
      fetchOrganization()
      fetchUsers()
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
      setFormData({
        name: organizationData.name,
        description: organizationData.description || ""
      })
    } catch (error) {
      console.error("Error fetching organization:", error)
      setError(error instanceof Error ? error.message : "Failed to load organization. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/organizations/${id}/users`)
      if (response.ok) {
        const usersData = await response.json()
        setAllUsers(usersData)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (organization) {
      setFormData({
        name: organization.name,
        description: organization.description || ""
      })
    }
  }

  const handleSave = async () => {
    try {
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
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating organization:", error)
      setError(error instanceof Error ? error.message : "Failed to update organization")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this organization? This action cannot be undone.")) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/organizations/${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete organization")
      }

      router.push("/organizations")
    } catch (error) {
      console.error("Error deleting organization:", error)
      setError(error instanceof Error ? error.message : "Failed to delete organization")
      setIsDeleting(false)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail) return

    try {
      setIsInviting(true)
      const response = await fetch(`/api/organizations/${id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: inviteEmail })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to invite member")
      }

      const updatedOrganization = await response.json()
      setOrganization(updatedOrganization)
      setInviteSuccess(true)
      setInviteEmail("")

      // Close dialog after success
      setTimeout(() => {
        setInviteDialogOpen(false)
        setInviteSuccess(false)
      }, 2000)
    } catch (error) {
      console.error("Error inviting member:", error)
      setError(error instanceof Error ? error.message : "Failed to invite member")
    } finally {
      setIsInviting(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId) return

    try {
      setIsInviting(true)
      const response = await fetch(`/api/organizations/${id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId: selectedUserId, role: selectedRole })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add member")
      }

      const updatedOrganization = await response.json()
      setOrganization(updatedOrganization)
      setAddMemberDialogOpen(false)
      setSelectedUserId("")
      setSelectedRole("MEMBER")
    } catch (error) {
      console.error("Error adding member:", error)
      setError(error instanceof Error ? error.message : "Failed to add member")
    } finally {
      setIsInviting(false)
    }
  }

  const handleUpdateMemberRole = async (userId: string, role: string) => {
    try {
      const response = await fetch(`/api/organizations/${id}/members`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, role })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update member role")
      }

      const updatedOrganization = await response.json()
      setOrganization(updatedOrganization)
    } catch (error) {
      console.error("Error updating member role:", error)
      setError(error instanceof Error ? error.message : "Failed to update member role")
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member from the organization?")) {
      return
    }

    try {
      const response = await fetch(`/api/organizations/${id}/members?userId=${userId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove member")
      }

      // Refresh organization data
      fetchOrganization()
    } catch (error) {
      console.error("Error removing member:", error)
      setError(error instanceof Error ? error.message : "Failed to remove member")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800"
      case "ARCHIVED": return "bg-gray-100 text-gray-800"
      case "COMPLETED": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER": return "bg-purple-100 text-purple-800"
      case "ADMIN": return "bg-blue-100 text-blue-800"
      case "MANAGER": return "bg-green-100 text-green-800"
      case "MEMBER": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  // Get current user's role in this organization
  const getUserRole = () => {
    if (!organization || !session?.user?.id) return null

    const member = organization.members.find(m => m.user.id === session.user.id)
    return member ? member.role : null
  }

  const userRole = getUserRole()
  const isAdmin = session?.user?.role === "ADMIN"
  const canEdit = isAdmin || (userRole && (userRole === "OWNER" || userRole === "ADMIN"))
  const canDelete = isAdmin || (userRole === "OWNER")
  const canManageMembers = canEdit

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/organizations">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
              <p className="text-muted-foreground">
                Created {formatDate(organization.createdAt)}
                {userRole && (
                  <Badge className={`ml-2 ${getRoleColor(userRole)}`}>
                    {userRole}
                  </Badge>
                )}
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={isDeleting}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={handleCancel} disabled={isDeleting}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>

                  {canManageMembers && (
                    <>
                      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Mail className="mr-2 h-4 w-4" />
                            Invite
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Invite Member</DialogTitle>
                            <DialogDescription>
                              Enter the email address of the user you want to invite to this organization.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                placeholder="user@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleInviteMember} disabled={isInviting || !inviteEmail}>
                              {isInviting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Inviting...
                                </>
                              ) : (
                                <>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Invitation
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                          {inviteSuccess && (
                            <div className="flex items-center justify-center p-4 text-green-600">
                              <Check className="mr-2 h-4 w-4" />
                              Invitation sent successfully!
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Member
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add Member</DialogTitle>
                            <DialogDescription>
                              Add an existing user to this organization.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="user" className="text-right">
                                User
                              </Label>
                              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a user" />
                                </SelectTrigger>
                                <SelectContent>
                                  {allUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.name} ({user.email})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="role" className="text-right">
                                Role
                              </Label>
                              <Select value={selectedRole} onValueChange={setSelectedRole}>
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
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleAddMember} disabled={isInviting || !selectedUserId}>
                              {isInviting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Add Member
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}

                  {canDelete && (
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="teams">Teams</TabsTrigger>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Organization Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Organization Name</label>
                          <Input
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <Textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-2xl font-bold">{organization.name}</h2>
                          {organization.description && (
                            <p className="text-muted-foreground mt-2">{organization.description}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium mb-1">Created</h3>
                            <p className="text-muted-foreground">{formatDate(organization.createdAt)}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium mb-1">Last Updated</h3>
                            <p className="text-muted-foreground">{formatDate(organization.updatedAt)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Navigation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href={`/organizations/${organization.id}/dashboard`}>
                        <Activity className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href={`/organizations/${organization.id}/settings`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href={`/organizations/${organization.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Organization
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dashboard" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Organization Dashboard
                    </CardTitle>
                    <CardDescription>
                      Overview of organization metrics and activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        View detailed analytics and organization metrics
                      </p>
                      <Button asChild>
                        <Link href={`/organizations/${organization.id}/dashboard`}>
                          Go to Dashboard
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      Projects
                    </CardTitle>
                    <CardDescription>
                      Projects in this organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {organization.projects.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No projects in this organization</p>
                        {canEdit && (
                          <Button className="mt-2" asChild>
                            <Link href="/projects/create">
                              <Plus className="mr-2 h-4 w-4" />
                              Create Project
                            </Link>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {organization.projects.map(project => (
                          <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h3 className="font-medium">{project.name}</h3>
                              <p className="text-sm text-muted-foreground">Key: {project.key}</p>
                              {project.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(project.status)}>
                                {project.status}
                              </Badge>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/projects/${project.id}`}>
                                  View
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="teams" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users2 className="h-5 w-5" />
                      Teams
                    </CardTitle>
                    <CardDescription>
                      Teams in this organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {organization.teams.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No teams in this organization</p>
                        {canEdit && (
                          <Button className="mt-2" asChild>
                            <Link href="/teams/create">
                              <Plus className="mr-2 h-4 w-4" />
                              Create Team
                            </Link>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {organization.teams.map(team => (
                          <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h3 className="font-medium">{team.name}</h3>
                              {team.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">{team.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(team.status)}>
                                {team.status}
                              </Badge>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/teams/${team.id}`}>
                                  View
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Organization Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span>Projects</span>
                  </div>
                  <span className="font-medium">{organization._count.projects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-muted-foreground" />
                    <span>Teams</span>
                  </div>
                  <span className="font-medium">{organization._count.teams}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Members</span>
                  </div>
                  <span className="font-medium">{organization._count.members}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Members
                </CardTitle>
                <CardDescription>
                  People in this organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {organization.members.map(member => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={member.user.avatar} />
                          <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.user.name}</p>
                          <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor(member.role)}>
                          {member.role}
                        </Badge>
                        {canManageMembers && (
                          <div className="flex gap-1">
                            <Select
                              value={member.role}
                              onValueChange={(value) => handleUpdateMemberRole(member.user.id, value)}
                            >
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OWNER">Owner</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="MANAGER">Manager</SelectItem>
                                <SelectItem value="MEMBER">Member</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.user.id)}
                              disabled={member.user.id === session?.user?.id}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {canEdit && (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/organizations/${organization.id}/settings`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Organization Settings
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/organizations/${organization.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Organization
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/organizations/${organization.id}/dashboard`}>
                        <Activity className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}