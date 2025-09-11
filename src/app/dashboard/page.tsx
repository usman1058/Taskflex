// app/dashboard/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  CheckSquare, 
  Clock, 
  Users, 
  TrendingUp, 
  Plus,
  Calendar,
  AlertCircle,
  Target,
  FolderOpen,
  Loader2,
  Eye,
  MoreHorizontal,
  Circle,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
  creator: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  assignees: Array<{
    user: {
      id: string
      name: string | null
      email: string
      avatar: string | null
    }
  }>
  project: {
    id: string
    name: string
    key: string
  } | null
  taskTags: Array<{
    tag: {
      id: string
      name: string
      color: string | null
    }
  }>
  _count: {
    comments: number
    attachments: number
  }
}

interface Project {
  id: string
  name: string
  key: string
  description?: string
  _count: {
    tasks: number
  }
}

interface DashboardStats {
  totalTasks: number
  inProgress: number
  completed: number
  overdue: number
  teamMembers: number
  projects: number
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [projectStats, setProjectStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch all data in parallel
      const [tasksResponse, projectsResponse, usersStatsResponse] = await Promise.all([
        fetch("/api/tasks?limit=5"),
        fetch("/api/projects"),
        fetch("/api/users/stats")
      ])
      
      if (!tasksResponse.ok || !projectsResponse.ok || !usersStatsResponse.ok) {
        throw new Error("Failed to fetch dashboard data")
      }
      
      const tasksData = await tasksResponse.json()
      const projectsData = await projectsResponse.json()
      const usersStatsData = await usersStatsResponse.json()
      
      // Calculate stats
      const totalTasks = tasksData.pagination?.total || 0
      const inProgress = tasksData.tasks?.filter((task: Task) => task.status === "IN_PROGRESS").length || 0
      const completed = tasksData.tasks?.filter((task: Task) => task.status === "DONE").length || 0
      const overdue = tasksData.tasks?.filter((task: Task) => {
        if (!task.dueDate) return false
        return new Date(task.dueDate) < new Date() && task.status !== "DONE" && task.status !== "CLOSED"
      }).length || 0
      const teamMembers = usersStatsData.totalUsers || 0
      const projectCount = projectsData.length || 0
      
      setStats({
        totalTasks,
        inProgress,
        completed,
        overdue,
        teamMembers,
        projects: projectCount
      })
      
      // Set recent tasks
      setRecentTasks(tasksData.tasks?.slice(0, 5) || [])
      
      // Set projects
      setProjects(projectsData.slice(0, 5))
      
      // Calculate project stats
      const projectStatsData = await Promise.all(
        projectsData.slice(0, 4).map(async (project: Project) => {
          // Fetch tasks for each project to calculate progress
          const projectTasksResponse = await fetch(`/api/tasks?projectId=${project.id}`)
          if (!projectTasksResponse.ok) {
            return {
              id: project.id,
              name: project.name,
              progress: 0,
              taskCount: 0,
              completedTasks: 0
            }
          }
          
          const projectTasksData = await projectTasksResponse.json()
          const projectTasks = projectTasksData.tasks || []
          const taskCount = projectTasks.length
          const completedTasks = projectTasks.filter((task: Task) => task.status === "DONE").length
          const progress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0
          
          return {
            id: project.id,
            name: project.name,
            progress,
            taskCount,
            completedTasks
          }
        })
      )
      
      setProjectStats(projectStatsData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError("Failed to load dashboard data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-gray-100 text-gray-800"
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800"
      case "REVIEW": return "bg-yellow-100 text-yellow-800"
      case "DONE": return "bg-green-100 text-green-800"
      case "CLOSED": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW": return "bg-green-100 text-green-800"
      case "MEDIUM": return "bg-yellow-100 text-yellow-800"
      case "HIGH": return "bg-orange-100 text-orange-800"
      case "URGENT": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN": return <Circle className="h-4 w-4" />
      case "IN_PROGRESS": return <Clock className="h-4 w-4" />
      case "REVIEW": return <AlertTriangle className="h-4 w-4" />
      case "DONE": return <CheckCircle className="h-4 w-4" />
      default: return <Circle className="h-4 w-4" />
    }
  }

  const statsData = [
    {
      title: "Total Tasks",
      value: stats?.totalTasks.toString() || "0",
      change: "+12%",
      icon: CheckSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "In Progress",
      value: stats?.inProgress.toString() || "0",
      change: "+5%",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Completed",
      value: stats?.completed.toString() || "0",
      change: "+15%",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Overdue",
      value: stats?.overdue.toString() || "0",
      change: "-2%",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ]

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
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
            <Button onClick={fetchDashboardData}>Retry</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session?.user?.name}! Here's what's happening with your tasks.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/tasks/create">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tasks">
                View All Tasks
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat) => (
            <Card key={stat.title} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={stat.title === "Overdue" ? "text-red-600" : "text-green-600"}>
                    {stat.change}
                  </span> from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Tasks */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>
                  Your latest tasks and their current status
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/tasks">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <div key={task.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          {getStatusIcon(task.status)}
                          <div className="flex-1">
                            <h4 className="font-medium">{task.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {task.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace("_", " ")}
                          </Badge>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          
                          {task.project && (
                            <Badge variant="outline">
                              {task.project.name}
                            </Badge>
                          )}
                          
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {task.assignees.slice(0, 3).map((assignee) => (
                              <Avatar key={assignee.user.id} className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={assignee.user.avatar || ""} />
                                <AvatarFallback className="text-xs">
                                  {assignee.user.name?.charAt(0) || assignee.user.email.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          {task.assignees.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{task.assignees.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/tasks/${task.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/tasks/${task.id}`}>View Task</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/tasks/${task.id}/edit`}>Edit Task</Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks you might want to perform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" asChild>
                <Link href="/tasks/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Task
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/projects">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Manage Projects
                </Link>
              </Button>
              {session?.user?.role === "MANAGER" || session?.user?.role === "ADMIN" ? (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/users">
                    <Users className="mr-2 h-4 w-4" />
                    View Team
                  </Link>
                </Button>
              ) : null}
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/calendar">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Calendar
                </Link>
              </Button>
              
              <div className="pt-4 mt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Team Stats</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Team Members</span>
                    <span>{stats?.teamMembers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Projects</span>
                    <span>{stats?.projects}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Progress Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Project Progress</CardTitle>
              <CardDescription>
                Overview of your current project progress
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/projects">View All Projects</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectStats.length > 0 ? (
                projectStats.map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{project.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {project.progress}% ({project.completedTasks}/{project.taskCount})
                      </span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No projects found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}