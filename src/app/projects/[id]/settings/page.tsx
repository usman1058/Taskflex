// app/projects/[id]/settings/page.tsx
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
import {
    ArrowLeft,
    Save,
    Users,
    FolderOpen,
    Settings,
    Building,
    Users2,
    AlertTriangle,
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

interface Team {
    id: string
    name: string
    description: string | null
    status: string
    organizationId?: string
    createdAt: string
    updatedAt: string
    members: {
        user: {
            id: string
            name: string
            email: string
            avatar?: string
        }
    }[]
    _count: {
        tasks: number
        members: number
    }
}

interface Organization {
    id: string
    name: string
    description: string | null
    createdAt: string
    updatedAt: string
    projects: {
        id: string
        name: string
        key: string
    }[]
    teams: {
        id: string
        name: string
    }[]
    _count: {
        projects: number
        teams: number
        members: number
    }
}

export default function ProjectSettingsPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [project, setProject] = useState<Project | null>(null)
    const [teams, setTeams] = useState<Team[]>([])
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        key: "",
        status: "",
        organizationId: "",
        teamId: ""
    })

    useEffect(() => {
        if (id) {
            fetchProject()
            fetchTeams()
            fetchOrganizations()
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
                organizationId: projectData.organization?.id || "",
                teamId: projectData.team?.id || ""
            })
        } catch (error) {
            console.error("Error fetching project:", error)
            setError(error instanceof Error ? error.message : "Failed to load project. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const fetchTeams = async () => {
        try {
            const response = await fetch("/api/teams")
            if (response.ok) {
                const teamsData = await response.json()
                setTeams(teamsData)
            }
        } catch (error) {
            console.error("Error fetching teams:", error)
        }
    }

    const fetchOrganizations = async () => {
        try {
            const response = await fetch("/api/organizations")
            if (response.ok) {
                const orgsData = await response.json()
                setOrganizations(orgsData)
            }
        } catch (error) {
            console.error("Error fetching organizations:", error)
        }
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
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
        } catch (error) {
            console.error("Error updating project:", error)
            setError(error instanceof Error ? error.message : "Failed to update project")
        } finally {
            setIsSaving(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleStatusChange = (value: string) => {
        setFormData(prev => ({ ...prev, status: value }))
    }

    const handleOrganizationChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            organizationId: value === "none" ? "" : value,
            // Reset team if it doesn't belong to the selected organization
            teamId: teams.some(team => team.id === prev.teamId && team.organizationId === value)
                ? prev.teamId
                : ""
        }))
    }

    const handleTeamChange = (value: string) => {
        setFormData(prev => ({ ...prev, teamId: value === "none" ? "" : value }))
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

    if (error || !project) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center max-w-md">
                        <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
                        <h2 className="text-xl font-bold mb-2">Error</h2>
                        <p className="text-muted-foreground mb-4">{error || "Project not found"}</p>
                        <Button asChild>
                            <Link href={`/projects/${id}`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Project
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
                            <Link href={`/projects/${id}`}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
                    </div>

                    {isAdmin && (
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
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
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FolderOpen className="h-5 w-5" />
                                Project Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Project Name</label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    disabled={!isAdmin}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Project Key</label>
                                <Input
                                    name="key"
                                    value={formData.key}
                                    onChange={handleInputChange}
                                    disabled={!isAdmin}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    disabled={!isAdmin}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Status</label>
                                <Select value={formData.status} onValueChange={handleStatusChange} disabled={!isAdmin}>
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Organization & Team
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">


                            <div>
                                <label className="text-sm font-medium">Organization</label>
                                <Select value={formData.organizationId || "none"} onValueChange={handleOrganizationChange} disabled={!isAdmin}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an organization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Organization</SelectItem>
                                        {organizations.map(org => (
                                            <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Team</label>
                                <Select value={formData.teamId || "none"} onValueChange={handleTeamChange} disabled={!isAdmin}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a team" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Team</SelectItem>
                                        {teams
                                            .filter(team => !formData.organizationId || team.organizationId === formData.organizationId)
                                            .map(team => (
                                                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>

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
                        <div className="space-y-3">
                            {project.members.map(member => (
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

                {project.organization && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Organization Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="font-medium">{project.organization.name}</p>
                                {project.organization.description && (
                                    <p className="text-muted-foreground">{project.organization.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <FolderOpen className="h-4 w-4" />
                                        <span>{organizations.find(o => o.id === project.organization?.id)?._count?.projects || 0} projects</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users2 className="h-4 w-4" />
                                        <span>{organizations.find(o => o.id === project.organization?.id)?._count?.teams || 0} teams</span>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="mt-2" asChild>
                                    <Link href={`/organizations/${project.organization.id}`}>
                                        View Organization
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {project.team && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users2 className="h-5 w-5" />
                                Team Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="font-medium">{project.team.name}</p>
                                {project.team.description && (
                                    <p className="text-muted-foreground">{project.team.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        <span>{teams.find(t => t.id === project.team?.id)?._count?.members || 0} members</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FolderOpen className="h-4 w-4" />
                                        <span>{teams.find(t => t.id === project.team?.id)?._count?.tasks || 0} tasks</span>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="mt-2" asChild>
                                    <Link href={`/teams/${project.team.id}`}>
                                        View Team
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    )
}