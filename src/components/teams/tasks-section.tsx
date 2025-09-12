// components/teams/tasks-section.tsx
"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Search, 
  Filter,
  Calendar,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckSquare,
  Clock,
  Circle
} from "lucide-react"
import CreateTaskDialog from "@/components/tasks/create-task-dialog"
import EditTaskDialog from "@/components/tasks/edit-task-dialog"
import { format } from "date-fns"
import Link from "next/link"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  type: string
  dueDate: string | null
  createdAt: string
  updatedAt: string
  creatorId: string
  projectId: string | null
  teamId: string
  assignees: {
    user: {
      id: string
      name: string | null
      email: string
      avatar: string | null
    }
  }[]
}

interface TasksSectionProps {
  teamId: string
  userRole: string | null
}

export default function TasksSection({ teamId, userRole }: TasksSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL")

  useEffect(() => {
    fetchTasks()
  }, [teamId, statusFilter, priorityFilter])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (statusFilter !== "ALL") params.append("status", statusFilter)
      if (priorityFilter !== "ALL") params.append("priority", priorityFilter)
      
      const response = await fetch(`/api/teams/${teamId}/tasks?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`)
      }
      
      const tasksData = await response.json()
      setTasks(tasksData)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setError("Failed to load tasks. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "bg-red-100 text-red-800"
      case "HIGH": return "bg-orange-100 text-orange-800"
      case "MEDIUM": return "bg-yellow-100 text-yellow-800"
      case "LOW": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO": return "bg-gray-100 text-gray-800"
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800"
      case "REVIEW": return "bg-purple-100 text-purple-800"
      case "DONE": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "TODO": return <Circle className="h-4 w-4" />
      case "IN_PROGRESS": return <Clock className="h-4 w-4" />
      case "REVIEW": return <AlertCircle className="h-4 w-4" />
      case "DONE": return <CheckSquare className="h-4 w-4" />
      default: return <Circle className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy")
  }

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const canCreateTasks = userRole === "OWNER" || userRole === "ADMIN"

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-destructive text-lg mb-4">{error}</p>
          <Button onClick={fetchTasks}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <Badge variant="outline">{tasks.length}</Badge>
        </div>
        {canCreateTasks && (
          <CreateTaskDialog teamId={teamId} onTaskCreated={fetchTasks}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </CreateTaskDialog>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full p-2 border rounded-md"
          />
        </div>
        
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="TODO">To Do</TabsTrigger>
            <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
            <TabsTrigger value="REVIEW">Review</TabsTrigger>
            <TabsTrigger value="DONE">Done</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Tabs value={priorityFilter} onValueChange={setPriorityFilter}>
          <TabsList>
            <TabsTrigger value="ALL">All Priorities</TabsTrigger>
            <TabsTrigger value="URGENT">Urgent</TabsTrigger>
            <TabsTrigger value="HIGH">High</TabsTrigger>
            <TabsTrigger value="MEDIUM">Medium</TabsTrigger>
            <TabsTrigger value="LOW">Low</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No tasks found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL"
              ? "No tasks match your search or filters."
              : "Get started by creating your first task."
            }
          </p>
          {canCreateTasks && !searchTerm && statusFilter === "ALL" && priorityFilter === "ALL" && (
            <CreateTaskDialog teamId={teamId} onTaskCreated={fetchTasks}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </CreateTaskDialog>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <h3 className="font-semibold">{task.title}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
                {task.description && (
                  <CardDescription className="line-clamp-2">
                    {task.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {formatDate(task.dueDate)}</span>
                      </div>
                    )}
                    {task.project && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{task.project.key}</span>
                        <span>{task.project.name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.creator.avatar || ""} />
                        <AvatarFallback>
                          {task.creator.name?.charAt(0) || task.creator.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-xs">
                        <p className="font-medium">Creator</p>
                        <p className="text-muted-foreground">
                          {task.creator.name || task.creator.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/tasks/${task.id}`}>
                          View
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  
                  {task.assignees.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Assignees:</span>
                      <div className="flex -space-x-2">
                        {task.assignees.slice(0, 3).map((assignee) => (
                          <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={assignee.user.avatar || ""} />
                            <AvatarFallback>
                              {assignee.user.name?.charAt(0) || assignee.user.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {task.assignees.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                            +{task.assignees.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}