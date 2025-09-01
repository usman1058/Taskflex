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
  Plus
} from "lucide-react"
import Link from "next/link"

interface OrganizationMember {
  id: string
  name: string
  email: string
  avatar?: string
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
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })

  useEffect(() => {
    if (id) {
      fetchOrganization()
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

  const isAdmin = session?.user?.role === "ADMIN"

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
            <h1 className="text-3xl font-bold tracking-tight">Organization Details</h1>
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
                    {isAdmin && (
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
                    {isAdmin && (
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
                    <div key={member.id} className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
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
                {isAdmin && (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/organizations/${organization.id}/settings`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Organization Settings
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/projects/create">
                        <Plus className="mr-2 h-4 w-4" />
                        New Project
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/teams/create">
                        <Plus className="mr-2 h-4 w-4" />
                        New Team
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