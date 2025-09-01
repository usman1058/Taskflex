// app/projects/[id]/tasks/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  User,
  Flag,
  AlertTriangle,
  CheckCircle,
  Clock,
  Circle,
  Loader2
} from "lucide-react"
import Link from "next/link"

interface Task {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
  assignee?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  creator: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  taskTags: {
    tag: {
      id: string
      name: string
      color: string
    }
  }[]
}

export default function ProjectTasksPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [project, setProject] = useState<{ name: string; key: string } | null>(null)

  useEffect(() => {
    if (id) {
      fetchTasks()
      fetchProject()
    }
  }, [id, statusFilter, priorityFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (id) {
        fetchTasks()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (priorityFilter !== "all") params.append("priority", priorityFilter)
      
      const queryString = params.toString()
      const url = `/api/projects/${id}/tasks${queryString ? `?${queryString}` : ""}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`)
      }
      
      const data = await response.json()
      setTasks(data.tasks)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setError("Failed to load tasks. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`)
      if (response.ok) {
        const projectData = await response.json()
        setProject({
          name: projectData.name,
          key: projectData.key
        })
      }
    } catch (error) {
      console.error("Error fetching project:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN": return <Circle className="h-4 w-4 text-gray-500" />
      case "IN_PROGRESS": return <Clock className="h-4 w-4 text-blue-500" />
      case "REVIEW": return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "DONE": return <CheckCircle className="h-4 w-4 text-green-500" />
      case "CLOSED": return <CheckCircle className="h-4 w-4 text-gray-500" />
      case "CANCELLED": return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Circle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-gray-100 text-gray-800"
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800"
      case "REVIEW": return "bg-yellow-100 text-yellow-800"
      case "DONE": return "bg-green-100 text-green-800"
      case "CLOSED": return "bg-gray-100 text-gray-800"
      case "CANCELLED": return "bg-red-100 text-red-800"
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date"
    return new Date(dateString).toLocaleDateString()
  }

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER"

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
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-destructive text-lg mb-4">{error}</p>
            <Button onClick={fetchTasks}>Retry</Button>
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
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
              <p className="text-muted-foreground">
                {project ? `${project.key} - ${project.name}` : 'Project Tasks'}
              </p>
            </div>
          </div>
          
          {isAdmin && (
            <Button asChild>
              <Link href={`/projects/${id}/tasks/create`}>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Link>
            </Button>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Task List</CardTitle>
            <CardDescription>
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                    ? "No tasks match your filters."
                    : "No tasks yet. Create your first task to get started."
                  }
                </p>
                {!searchTerm && statusFilter === "all" && priorityFilter === "all" && isAdmin && (
                  <Button className="mt-4" asChild>
                    <Link href={`/projects/${id}/tasks/create`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Task
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getStatusIcon(task.status)}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{task.title}</h3>
                              <Badge className={getStatusColor(task.status)}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(task.priority)}>
                                <Flag className="mr-1 h-3 w-3" />
                                {task.priority}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-muted-foreground text-sm line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {task.taskTags.map(({ tag }) => (
                                <Badge key={tag.id} variant="outline" style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color }}>
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(task.dueDate)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>
                                  {task.assignee ? task.assignee.name : "Unassigned"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/tasks/${task.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}