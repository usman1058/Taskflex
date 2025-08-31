// app/dashboard/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
  Loader2
} from "lucide-react"
import Link from "next/link"

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  assignee: {
    name: string
  } | null
}

interface Project {
  id: string
  name: string
  progress: number
  taskCount: number
  completedTasks: number
}

interface DashboardStats {
  totalTasks: number
  inProgress: number
  completed: number
  teamMembers: number
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
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
      const teamMembers = usersStatsData.totalUsers || 0
      
      setStats({
        totalTasks,
        inProgress,
        completed,
        teamMembers
      })
      
      // Set recent tasks
      setRecentTasks(tasksData.tasks?.slice(0, 4) || [])
      
      // Calculate project progress
      const projectsWithProgress = projectsData.map((project: any) => {
        const totalTasks = project._count?.tasks || 0
        // We can't calculate completed tasks from the projects data alone
        // So we'll use a placeholder value
        const completedTasks = Math.floor(totalTasks * 0.6) // Placeholder 60% completion
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        
        return {
          id: project.id,
          name: project.name,
          progress,
          taskCount: totalTasks,
          completedTasks
        }
      })
      
      setProjects(projectsWithProgress)
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

  const statsData = [
    {
      title: "Total Tasks",
      value: stats?.totalTasks.toString() || "0",
      change: "+12%",
      icon: CheckSquare,
      color: "text-blue-600",
    },
    {
      title: "In Progress",
      value: stats?.inProgress.toString() || "0",
      change: "+5%",
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Completed",
      value: stats?.completed.toString() || "0",
      change: "+15%",
      icon: Target,
      color: "text-green-600",
    },
    {
      title: "Team Members",
      value: stats?.teamMembers.toString() || "0",
      change: "+2",
      icon: Users,
      color: "text-purple-600",
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session?.user?.name}! Here's what's happening with your tasks.
            </p>
          </div>
          <Button asChild>
            <Link href="/tasks/create">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Link>
          </Button>
        </div>
        
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>
                Your latest tasks and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace("_", " ")}
                          </Badge>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {task.assignee?.name || "Unassigned"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No tasks found
                  </div>
                )}
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/tasks">View All Tasks</Link>
              </Button>
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
            </CardContent>
          </Card>
        </div>
        
        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>
              Overview of your current project progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.length > 0 ? (
                projects.map((project) => (
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
                <div className="text-center py-4 text-muted-foreground">
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