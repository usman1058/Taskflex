"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CreateTeamDialog from "@/components/teams/create-team-dialog"
import { MeetingsList } from "@/components/teams/meetings-list"
import { ScheduleMeetingDialog } from "@/components/teams/schedule-meeting-dialog"
import {
    ArrowLeft,
    Users,
    Settings,
    UserPlus,
    Calendar,
    Target,
    TrendingUp,
    Loader2,
    AlertCircle,
    Edit,
    Trash2,
    Plus,
    CheckSquare,
    FolderOpen,
    UserCheck,
    Video
} from "lucide-react"
import EditMemberRoleDialog from "@/components/teams/edit-member-dialog"
import RemoveMemberDialog from "@/components/teams/delete-member-dialog"
import InviteMemberDialog from "@/components/teams/invite-member-dialog"
import Link from "next/link"
import { format } from "date-fns"

// Add interfaces for tasks and assignments
interface Task {
    id: string
    title: string
    description: string
    status: string
    dueDate: string
    assigneeId: string
}

interface Assignment {
    id: string
    taskId: string
    projectId: string
    memberId: string
    role: string
}

interface Team {
    id: string
    name: string
    description: string | null
    avatar: string | null
    status: string
    createdAt: string
    updatedAt: string
    owner: {
        id: string
        name: string | null
        email: string
        avatar: string | null
    }
    members: {
        id: string
        userId: string
        role: string
        status: string
        user: {
            id: string
            name: string | null
            email: string
            avatar: string | null
        }
    }[]
    projects: {
        id: string
        name: string
        key: string
        status: string
        _count: {
            tasks: number
        }
    }[]
    tasks: Task[] // Add tasks to the team interface
    _count: {
        members: number
        projects: number
    }
}

interface TeamDashboard {
    stats: {
        totalTasks: number
        completedTasks: number
        inProgressTasks: number
        overdueTasks: number
        totalProjects: number
        activeProjects: number
        completedProjects: number
    }
    monthlyTaskStats: {
        status: string
        _count: {
            id: number
        }
    }[]
    memberProductivity: {
        userId: string
        name: string
        assignedTasks: number
    }[]
}

export default function TeamDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const teamId = params.id as string
    const [team, setTeam] = useState<Team | null>(null)
    const [dashboard, setDashboard] = useState<TeamDashboard | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [selectedMember, setSelectedMember] = useState<string | null>(null)
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [isAssigning, setIsAssigning] = useState(false)

    useEffect(() => {
        fetchTeam()
        fetchDashboard()
    }, [teamId])

    const fetchTeam = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch(`/api/teams/${teamId}`)
            if (!response.ok) {
                throw new Error(`Failed to fetch team: ${response.status}`)
            }
            const teamData = await response.json()
            setTeam(teamData)

            if (teamData.ownerId === session?.user?.id) {
                setUserRole("OWNER")
            } else {
                const membership = teamData.members.find(m => m.userId === session?.user?.id)
                setUserRole(membership?.role || null)
            }
        } catch (error) {
            console.error("Error fetching team:", error)
            setError("Failed to load team. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const fetchDashboard = async () => {
        try {
            const response = await fetch(`/api/teams/${teamId}/dashboard`)
            if (response.ok) {
                const dashboardData = await response.json()
                setDashboard(dashboardData)
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error)
        }
    }

    const handleAssignTask = async (memberId: string, taskId: string) => {
        if (!team) return;

        try {
            setIsAssigning(true);
            const response = await fetch(`/api/teams/${teamId}/assignments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    memberId,
                    taskId,
                    role: 'ASSIGNEE'
                }),
            });

            if (response.ok) {
                // Refresh team data to show updated assignments
                fetchTeam();
            }
        } catch (error) {
            console.error("Error assigning task:", error);
        } finally {
            setIsAssigning(false);
        }
    };

    const handleAssignProject = async (memberId: string, projectId: string, role: string) => {
        if (!team) return;

        try {
            setIsAssigning(true);
            const response = await fetch(`/api/teams/${teamId}/assignments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    memberId,
                    projectId,
                    role
                }),
            });

            if (response.ok) {
                // Refresh team data to show updated assignments
                fetchTeam();
            }
        } catch (error) {
            console.error("Error assigning project:", error);
        } finally {
            setIsAssigning(false);
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case "OWNER": return "bg-purple-100 text-purple-800"
            case "ADMIN": return "bg-blue-100 text-blue-800"
            case "MEMBER": return "bg-gray-100 text-gray-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACTIVE": return "bg-green-100 text-green-800"
            case "PENDING": return "bg-yellow-100 text-yellow-800"
            case "INACTIVE": return "bg-gray-100 text-gray-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "MMM dd, yyyy")
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


    // Add this function to check if user can create meetings
    const canCreateMeetings = () => {
        if (!session || !team) return false

        // Team owner can always create meetings
        if (team.ownerId === session.user.id) return true

        // Admin members can create meetings
        const isAdmin = team.members.some(
            member => member.userId === session.user.id && member.role === "ADMIN"
        )

        return isAdmin
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

    if (error || !team) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-destructive text-lg mb-4">{error || "Team not found"}</p>
                        <Button onClick={() => router.back()}>Go Back</Button>
                    </div>
                </div>
            </MainLayout>
        )
    }

    const isAdmin = userRole === "OWNER" || userRole === "ADMIN";

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/teams">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Teams
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
                            <Badge className={getStatusColor(team.status)}>
                                {team.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Created {formatDate(team.createdAt)}
                        </p>
                    </div>
                    {isAdmin && (
                        <div className="flex gap-2">
                            <InviteMemberDialog team={team}>
                                <Button>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Invite Member
                                </Button>
                            </InviteMemberDialog>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                New Task
                            </Button>
                            <Button variant="outline">
                                <FolderOpen className="mr-2 h-4 w-4" />
                                New Project
                            </Button>
                        </div>
                    )}
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="members">Members</TabsTrigger>
                        <TabsTrigger value="projects">Projects</TabsTrigger>
                        <TabsTrigger value="tasks">Tasks</TabsTrigger>
                        {dashboard && <TabsTrigger value="dashboard">Dashboard</TabsTrigger>}
                        {isAdmin && <TabsTrigger value="assignments">Assignments</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {dashboard?.stats.totalTasks || 0}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {dashboard?.stats.completedTasks || 0}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {dashboard?.stats.inProgressTasks || 0}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Members</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {team._count.members}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">
                                    {team.description || "No description provided."}
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="members" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Members</CardTitle>
                                <CardDescription>
                                    People who are part of this team
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {team.members.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={member.user.avatar || ""} />
                                                    <AvatarFallback>
                                                        {member.user.name?.charAt(0) || member.user.email.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{member.user.name || member.user.email}</p>
                                                    {member.user.name && (
                                                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={getRoleColor(member.role)}>
                                                    {member.role}
                                                </Badge>
                                                <Badge className={getStatusColor(member.status)} variant="outline">
                                                    {member.status}
                                                </Badge>
                                                {isAdmin && (
                                                    <div className="flex gap-1">
                                                        <EditMemberRoleDialog teamId={team.id} membership={member}>
                                                            <Button variant="ghost" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </EditMemberRoleDialog>
                                                        {member.role !== "OWNER" && (
                                                            <RemoveMemberDialog teamId={team.id} membership={member}>
                                                                <Button variant="ghost" size="sm">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </RemoveMemberDialog>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="projects" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Team Projects</CardTitle>
                                        <CardDescription>
                                            Projects associated with this team
                                        </CardDescription>
                                    </div>
                                    {isAdmin && (
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            New Project
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">

                                    {team.projects && team.projects.length > 0 ? (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <FolderOpen className="h-5 w-5" />
                                                    Projects
                                                </CardTitle>
                                                <CardDescription>
                                                    Projects associated with this team
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {team.projects.map((project) => (
                                                        <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                                            <div>
                                                                <p className="font-medium">{project.name}</p>
                                                                <p className="text-sm text-muted-foreground">{project.key}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge className={getStatusColor(project.status)}>
                                                                    {project.status}
                                                                </Badge>
                                                                <Button variant="outline" size="sm" asChild>
                                                                    <Link href={`/projects/${project.id}`}>
                                                                        View Project
                                                                    </Link>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <FolderOpen className="h-5 w-5" />
                                                    Projects
                                                </CardTitle>
                                                <CardDescription>
                                                    No projects associated with this team yet
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-center py-8">
                                                    <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                                    <p className="text-muted-foreground">
                                                        This team doesn't have any projects yet.
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="Meeting" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Video className="h-5 w-5" />
                                        Team Meetings
                                    </div>
                                    {canCreateMeetings() && (
                                        <ScheduleMeetingDialog team={team}>
                                            <Button size="sm">
                                                Schedule Meeting
                                            </Button>
                                        </ScheduleMeetingDialog>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    Team meetings and Google Meet sessions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <MeetingsList
                                    teamId={team.id}
                                    canCreateMeetings={canCreateMeetings()}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="tasks" className="space-y-4">


                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Team Tasks</CardTitle>
                                        <CardDescription>
                                            Tasks assigned to team members
                                        </CardDescription>
                                    </div>
                                    {isAdmin && (
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            New Task
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {team.tasks && team.tasks.length > 0 ? (
                                        team.tasks.map((task) => (
                                            <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <h3 className="font-medium">{task.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{task.description}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={getStatusColor(task.status)}>
                                                        {task.status}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        Due: {formatDate(task.dueDate)}
                                                    </span>
                                                    {isAdmin && (
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No tasks found
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {dashboard && (
                        <TabsContent value="dashboard" className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {dashboard.stats.overdueTasks}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                                        <Settings className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {dashboard.stats.activeProjects}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Member Productivity</CardTitle>
                                    <CardDescription>
                                        Task distribution among team members
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {dashboard.memberProductivity.map((member) => (
                                            <div key={member.userId} className="flex items-center justify-between">
                                                <span className="font-medium">{member.name}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {member.assignedTasks} tasks assigned
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {isAdmin && (
                        <TabsContent value="assignments" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Assign Tasks, Roles & Projects</CardTitle>
                                    <CardDescription>
                                        Assign tasks and projects to team members
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-medium mb-4">Assign Tasks</h3>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Select Member</label>
                                                    <select
                                                        className="w-full p-2 border rounded-md"
                                                        value={selectedMember || ""}
                                                        onChange={(e) => setSelectedMember(e.target.value)}
                                                    >
                                                        <option value="">Select a member</option>
                                                        {team.members.map(member => (
                                                            <option key={member.id} value={member.id}>
                                                                {member.user.name || member.user.email}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Select Task</label>
                                                    <select
                                                        className="w-full p-2 border rounded-md"
                                                        disabled={!selectedMember}
                                                    >
                                                        <option value="">Select a task</option>
                                                        {team.tasks?.map(task => (
                                                            <option key={task.id} value={task.id}>
                                                                {task.title}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <Button
                                                    onClick={() => {
                                                        if (selectedMember) {
                                                            // Handle task assignment
                                                        }
                                                    }}
                                                    disabled={!selectedMember || isAssigning}
                                                >
                                                    {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                                                    Assign Task
                                                </Button>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-medium mb-4">Assign Projects & Roles</h3>
                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Select Member</label>
                                                    <select
                                                        className="w-full p-2 border rounded-md"
                                                        value={selectedMember || ""}
                                                        onChange={(e) => setSelectedMember(e.target.value)}
                                                    >
                                                        <option value="">Select a member</option>
                                                        {team.members.map(member => (
                                                            <option key={member.id} value={member.id}>
                                                                {member.user.name || member.user.email}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Select Project</label>
                                                    <select
                                                        className="w-full p-2 border rounded-md"
                                                        disabled={!selectedMember}
                                                    >
                                                        <option value="">Select a project</option>
                                                        {team.projects.map(project => (
                                                            <option key={project.id} value={project.id}>
                                                                {project.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Select Role</label>
                                                    <select
                                                        className="w-full p-2 border rounded-md"
                                                        disabled={!selectedMember}
                                                    >
                                                        <option value="MEMBER">Member</option>
                                                        <option value="ADMIN">Admin</option>
                                                        <option value="VIEWER">Viewer</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <Button
                                                    onClick={() => {
                                                        if (selectedMember) {
                                                            // Handle project assignment
                                                        }
                                                    }}
                                                    disabled={!selectedMember || isAssigning}
                                                >
                                                    {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                                                    Assign Project & Role
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </MainLayout>
    )
}