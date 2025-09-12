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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Activity,
  Zap,
  Star,
  MessageSquare,
  FileText,
  ArrowUp,
  ArrowDown,
  Filter,
  RefreshCw,
  ChevronDown
} from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

// Interfaces for type safety
interface DashboardStats {
  totalTasks: number
  inProgress: number
  completed: number
  overdue: number
  teamMembers: number
  projects: number
}

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  dueDate?: string
  project?: {
    id: string
    name: string
  }
  assignees: Array<{
    user: {
      id: string
      name: string
      email: string
      avatar?: string
    }
  }>
}

interface Project {
  id: string
  name: string
  description?: string
  status: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
  link?: string
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  newUsers: number
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [projectStats, setProjectStats] = useState<any[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("month")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch all data in parallel
      const [tasksResponse, projectsResponse, notificationsResponse, userStatsResponse] = await Promise.all([
        fetch("/api/tasks?limit=5"),
        fetch("/api/projects"),
        fetch("/api/notifications?limit=10"),
        fetch("/api/users/stats")
      ])
      
      if (!tasksResponse.ok || !projectsResponse.ok || !notificationsResponse.ok || !userStatsResponse.ok) {
        throw new Error("Failed to fetch dashboard data")
      }
      
      const tasksData = await tasksResponse.json()
      const projectsData = await projectsResponse.json()
      const notificationsData = await notificationsResponse.json()
      const userStatsData = await userStatsResponse.json()
      
      // Calculate stats
      const totalTasks = tasksData.pagination?.total || 0
      const inProgress = tasksData.tasks?.filter((task: Task) => task.status === "IN_PROGRESS").length || 0
      const completed = tasksData.tasks?.filter((task: Task) => task.status === "DONE").length || 0
      const overdue = tasksData.tasks?.filter((task: Task) => {
        if (!task.dueDate) return false
        return new Date(task.dueDate) < new Date() && task.status !== "DONE" && task.status !== "CLOSED"
      }).length || 0
      const teamMembers = userStatsData.totalUsers || 0
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
      
      // Set notifications (as activity feed)
      setNotifications(notificationsData.slice(0, 8) || [])
      
      // Set user stats
      setUserStats(userStatsData)
      
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

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "REVIEW": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      case "DONE": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "CLOSED": return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
      default: return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "HIGH": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
      case "URGENT": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      default: return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return <div className="p-1.5 bg-blue-100 dark:bg-blue-900/20 rounded-full">
          <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full" />
        </div>
      case "TASK_UPDATED":
        return <div className="p-1.5 bg-amber-100 dark:bg-amber-900/20 rounded-full">
          <div className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full" />
        </div>
      case "TASK_COMPLETED":
        return <div className="p-1.5 bg-green-100 dark:bg-green-900/20 rounded-full">
          <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full" />
        </div>
      case "COMMENT_ADDED":
      case "MENTION":
        return <div className="p-1.5 bg-purple-100 dark:bg-purple-900/20 rounded-full">
          <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full" />
        </div>
      case "TEAM_INVITATION":
        return <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/20 rounded-full">
          <div className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full" />
        </div>
      default:
        return <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
          <div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full" />
        </div>
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return "Just now"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
  }

  const statsData = [
    {
      title: "Total Tasks",
      value: stats?.totalTasks.toString() || "0",
      change: "+12%",
      icon: CheckSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      trend: "up"
    },
    {
      title: "In Progress",
      value: stats?.inProgress.toString() || "0",
      change: "+5%",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      trend: "up"
    },
    {
      title: "Completed",
      value: stats?.completed.toString() || "0",
      change: "+15%",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      trend: "up"
    },
    {
      title: "Overdue",
      value: stats?.overdue.toString() || "0",
      change: "-2%",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      trend: "down"
    },
  ]

  // Dashboard Skeleton Loader
  const DashboardSkeleton = () => (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      
      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Main Content Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Tasks Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex justify-between mb-3">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                    <div className="flex gap-2 mb-3">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="flex justify-between">
                      <div className="flex -space-x-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Project Progress Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column Skeleton */}
        <div className="space-y-6">
          {/* Quick Actions Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
          
          {/* Team Activity Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <MainLayout>
        <DashboardSkeleton />
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
          <div className="text-center max-w-md">
            <div className="mx-auto bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Error Loading Dashboard</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Filter className="h-4 w-4" />
                  {timeRange === "week" ? "This Week" : "This Month"}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTimeRange("week")}>
                  This Week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeRange("month")}>
                  This Month
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeRange("quarter")}>
                  This Quarter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild>
              <Link href="/tasks/create">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat) => (
            <Card key={stat.title} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs flex items-center gap-1 mt-1">
                  {stat.trend === "up" ? (
                    <ArrowUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-green-500" />
                  )}
                  <span className={stat.title === "Overdue" ? "text-red-600" : "text-green-600"}>
                    {stat.change}
                  </span> from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Recent Tasks and Projects */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Tasks */}
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Recent Tasks
                  </CardTitle>
                  <CardDescription>
                    Your latest tasks and their current status
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-1" asChild>
                  <Link href="/tasks">
                    View All <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
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
                      <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No tasks found</p>
                      <p className="text-sm mt-1">Create a new task to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Progress */}
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Project Progress
                  </CardTitle>
                  <CardDescription>
                    Overview of your current project progress
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-1" asChild>
                  <Link href="/projects">
                    View All <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-5">
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
                      <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No projects found</p>
                      <p className="text-sm mt-1">Create a new project to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Actions and Activity */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common tasks you might want to perform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <Button className="w-full justify-start gap-2" asChild>
                  <Link href="/tasks/create">
                    <Plus className="h-4 w-4" />
                    Create New Task
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link href="/projects">
                    <FolderOpen className="h-4 w-4" />
                    Manage Projects
                  </Link>
                </Button>
                {session?.user?.role === "MANAGER" || session?.user?.role === "ADMIN" ? (
                  <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link href="/users">
                      <Users className="h-4 w-4" />
                      View Team
                    </Link>
                  </Button>
                ) : null}
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link href="/calendar">
                    <Calendar className="h-4 w-4" />
                    View Calendar
                  </Link>
                </Button>
                <div className="pt-4 mt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Team Stats</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/20 rounded-md">
                          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm text-muted-foreground">Team Members</span>
                      </div>
                      <span className="font-medium">{stats?.teamMembers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/20 rounded-md">
                          <FolderOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm text-muted-foreground">Projects</span>
                      </div>
                      <span className="font-medium">{stats?.projects}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Activity */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Team Activity
                </CardTitle>
                <CardDescription>
                  Recent updates from your team
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{notification.title}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}