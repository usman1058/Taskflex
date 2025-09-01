// app/projects/[id]/page.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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
  Building,
  Users2,
  AlertTriangle,
  UserPlus,
  Mail,
  Check,
  Loader2
} from "lucide-react"
import Link from "next/link"

interface ProjectMember {
  id: string
  name: string
  email: string
  avatar?: string
}

interface Project {
  id: string
  name: string
  description: string | null
  key: string
  status: string
  createdAt: string
  updatedAt: string
  members: ProjectMember[]
  organization?: {
    id: string
    name: string
    description?: string
  }
  team?: {
    id: string
    name: string
    description?: string
    organizationId?: string
  }
  _count: {
    tasks: number
    members: number
  }
}

export default function ProjectDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    key: "",
    status: "",
    memberIds: [] as string[]
  })
  const [allUsers, setAllUsers] = useState<ProjectMember[]>([])

  useEffect(() => {
    if (id) {
      fetchProject()
      fetchUsers()
    }
  }, [id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/projects/${id}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError("Project not found")
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to fetch project: ${response.status}`)
        }
        return
      }

      const projectData = await response.json()
      setProject(projectData)
      setFormData({
        name: projectData.name,
        description: projectData.description || "",
        key: projectData.key,
        status: projectData.status,
        memberIds: projectData.members.map((m: ProjectMember) => m.id)
      })
    } catch (error) {
      console.error("Error fetching project:", error)
      setError(error instanceof Error ? error.message : "Failed to load project. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
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
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || "",
        key: project.key,
        status: project.status,
        memberIds: project.members.map(m => m.id)
      })
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update project")
      }

      const updatedProject = await response.json()
      setProject(updatedProject)
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating project:", error)
      setError(error instanceof Error ? error.message : "Failed to update project")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete project")
      }

      router.push("/projects")
    } catch (error) {
      console.error("Error deleting project:", error)
      setError(error instanceof Error ? error.message : "Failed to delete project")
      setIsDeleting(false)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail) return

    try {
      setIsInviting(true)
      const response = await fetch(`/api/projects/${id}/invite`, {
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

      const updatedProject = await response.json()
      setProject(updatedProject)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value }))
  }

  const handleMemberChange = (userId: string, checked: boolean) => {
    setFormData(prev => {
      if (checked) {
        return { ...prev, memberIds: [...prev.memberIds, userId] }
      } else {
        return { ...prev, memberIds: prev.memberIds.filter(id => id !== userId) }
      }
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800"
      case "ARCHIVED": return "bg-gray-100 text-gray-800"
      case "COMPLETED": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isAdmin = session?.user?.role === "ADMIN"

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    )
  }

  if (error || !project) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error || "Project not found"}</p>
            <Button asChild>
              <Link href="/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
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
              <Link href="/projects">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Project Details</h1>
          </div>

          {isAdmin && (
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
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Invite Member</DialogTitle>
                        <DialogDescription>
                          Enter the email address of the user you want to invite to this project.
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

                  <Button variant="outline" onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
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
                </>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Project Name</label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Project Key</label>
                      <Input
                        name="key"
                        value={formData.key}
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
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select value={formData.status} onValueChange={handleStatusChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="ARCHIVED">Archived</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{project.name}</h2>
                        <p className="text-sm text-muted-foreground">Key: {project.key}</p>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    {project.description && (
                      <div>
                        <h3 className="text-sm font-medium mb-1">Description</h3>
                        <p className="text-muted-foreground">{project.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-1">Created</h3>
                        <p className="text-muted-foreground">{formatDate(project.createdAt)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">Last Updated</h3>
                        <p className="text-muted-foreground">{formatDate(project.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Project Members
                </CardTitle>
                <CardDescription>
                  People who have access to this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-3">
                    {allUsers.map(user => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={formData.memberIds.includes(user.id)}
                          onChange={(e) => handleMemberChange(user.id, e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor={`user-${user.id}`} className="flex items-center space-x-2 cursor-pointer">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {project.members.map(member => (
                      <div className="space-y-3">
                        {project.members.map(member => (
                          <div key={member.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/users/${member.id}`}>
                                View Profile
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Project Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span>Tasks</span>
                  </div>
                  <span className="font-medium">{project._count.tasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Members</span>
                  </div>
                  <span className="font-medium">{project._count.members}</span>
                </div>
              </CardContent>
            </Card>

            {project.organization && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Organization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{project.organization.name}</p>
                  {project.organization.description && (
                    <p className="text-sm text-muted-foreground mt-1">{project.organization.description}</p>
                  )}
                  <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
                    <Link href={`/organizations/${project.organization.id}`}>
                      View Organization
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {project.team && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users2 className="h-5 w-5" />
                    Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{project.team.name}</p>
                  {project.team.description && (
                    <p className="text-sm text-muted-foreground mt-1">{project.team.description}</p>
                  )}
                  <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
                    <Link href={`/teams/${project.team.id}`}>
                      View Team
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/projects/${project.id}/tasks`}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    View Tasks
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/projects/${project.id}/settings`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Project Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}