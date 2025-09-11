"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
  Circle,
  Loader2,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  FileText,
  User,
  Calendar,
  MessageSquare,
  Paperclip
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { format } from "date-fns"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
  updatedAt: string
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
  parentTask: {
    id: string
    title: string
  } | null
  subtasks: Array<{
    id: string
    title: string
    status: string
  }>
  _count: {
    comments: number
    attachments: number
  }
}

export default function TasksPage() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "hierarchy">("hierarchy")
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (priorityFilter !== "all") params.append("priority", priorityFilter)
      
      const response = await fetch(`/api/tasks?${params.toString()}`)
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

  const handleSearch = () => {
    fetchTasks()
  }

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return
    
    try {
      setDeleting(true)
      const response = await fetch(`/api/tasks/${taskToDelete.id}`, {
        method: "DELETE"
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete task")
      }
      
      // Remove the task from the list
      setTasks(tasks.filter(task => task.id !== taskToDelete.id))
      
      // Close the dialog
      setDeleteDialogOpen(false)
      setTaskToDelete(null)
    } catch (error) {
      console.error("Error deleting task:", error)
      alert("Failed to delete task. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        throw new Error("Failed to update task status")
      }
      
      // Update the task in the list
      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ))
    } catch (error) {
      console.error("Error updating task status:", error)
      alert("Failed to update task status. Please try again.")
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

  // Group tasks by parent-child relationships
  const groupTasksByHierarchy = (tasks: Task[]) => {
    const parentTasks = tasks.filter(task => !task.parentTask)
    const childTasks = tasks.filter(task => task.parentTask)
    
    // Create a map of parent tasks with their children
    const taskMap = new Map<string, Task & { children: Task[] }>()
    
    // Initialize map with parent tasks
    parentTasks.forEach(task => {
      taskMap.set(task.id, { ...task, children: [] })
    })
    
    // Add child tasks to their parents
    childTasks.forEach(task => {
      if (task.parentTask && taskMap.has(task.parentTask.id)) {
        const parent = taskMap.get(task.parentTask.id)!
        parent.children.push(task)
      } else {
        // If parent not found, add as a standalone task
        taskMap.set(task.id, { ...task, children: [] })
      }
    })
    
    return Array.from(taskMap.values())
  }

  // Updated renderTaskCard function with improved hierarchy design
  const renderTaskCard = (task: Task & { children?: Task[] }, level = 0) => {
    const isExpanded = expandedTasks.has(task.id)
    const hasChildren = task.children && task.children.length > 0
    
    // Calculate indentation based on level
    const indentWidth = level * 24
    
    return (
      <div key={task.id} className="space-y-2">
        <Card 
          className={`hover:shadow-md transition-all duration-200 overflow-hidden ${
            level > 0 ? 'ml-6 border-l-4 border-l-blue-200' : ''
          }`}
        >
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                {/* Hierarchy connector and title section */}
                <div className="flex items-start gap-3">
                  {/* Hierarchy connector and expand/collapse button */}
                  <div className="flex flex-col items-center mt-1">
                    {level > 0 && (
                      <div className="h-6 w-px bg-border"></div>
                    )}
                    {hasChildren && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleTaskExpansion(task.id)}
                      >
                        {isExpanded ?
                          <ChevronDown className="h-4 w-4" /> :
                          <ChevronRight className="h-4 w-4" />
                        }
                      </Button>
                    )}
                    {!hasChildren && level > 0 && (
                      <div className="h-6 w-6 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-border"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Status icon and title */}
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{task.title}</h3>
                        {hasChildren && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {task.children?.length} subtask{task.children?.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Parent task info for subtasks */}
                    {level > 0 && task.parentTask && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <FileText className="h-3 w-3" />
                        <span>Subtask of: {task.parentTask.title}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-muted-foreground text-sm line-clamp-2 ml-9">
                  {task.description}
                </p>
                
                <div className="flex flex-wrap gap-2 ml-9">
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace("_", " ")}
                  </Badge>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                  {task.taskTags.map((taskTag, index) => (
                    <Badge key={index} variant="outline">
                      {taskTag.tag.name}
                    </Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm ml-9">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">
                      {task.project?.name || "No project"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "No due date"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-1">
                      {task.assignees && task.assignees.length > 0 ? (
                        <>
                          <div className="flex -space-x-2">
                            {task.assignees.slice(0, 3).map((assignee, index) => (
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
                        </>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>{task._count.comments} comments</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span>{task._count.attachments} attachments</span>
                  </div>
                </div>
                
                {/* Quick status change buttons */}
                <div className="flex flex-wrap gap-2 pt-2 ml-9">
                  <Button
                    size="sm"
                    variant={task.status === "OPEN" ? "default" : "outline"}
                    onClick={() => handleStatusChange(task.id, "OPEN")}
                  >
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant={task.status === "IN_PROGRESS" ? "default" : "outline"}
                    onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}
                  >
                    In Progress
                  </Button>
                  <Button
                    size="sm"
                    variant={task.status === "REVIEW" ? "default" : "outline"}
                    onClick={() => handleStatusChange(task.id, "REVIEW")}
                  >
                    Review
                  </Button>
                  <Button
                    size="sm"
                    variant={task.status === "DONE" ? "default" : "outline"}
                    onClick={() => handleStatusChange(task.id, "DONE")}
                  >
                    Done
                  </Button>
                  <Button
                    size="sm"
                    variant={task.status === "CLOSED" ? "default" : "outline"}
                    onClick={() => handleStatusChange(task.id, "CLOSED")}
                  >
                    Closed
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/tasks/${task.id}`}>View</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/tasks/${task.id}/edit`}>Edit</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteClick(task)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Render child tasks if expanded */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border"></div>
            
            <div className="ml-6 space-y-2">
              {task.children?.map(childTask =>
                renderTaskCard(childTask, level + 1)
              )}
            </div>
          </div>
        )}
      </div>
    )
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

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-destructive text-lg mb-4">{error}</p>
            <Button onClick={fetchTasks}>Retry</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Group tasks by hierarchy
  const hierarchicalTasks = viewMode === "hierarchy" ? groupTasksByHierarchy(tasks) : tasks

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">
              Manage and track all your tasks in one place
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
            >
              List View
            </Button>
            <Button
              variant={viewMode === "hierarchy" ? "default" : "outline"}
              onClick={() => setViewMode("hierarchy")}
            >
              Hierarchy View
            </Button>
            <Button asChild>
              <Link href="/tasks/create">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSearch()
                      }
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value)
                  fetchTasks()
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">In Review</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={(value) => {
                  setPriorityFilter(value)
                  fetchTasks()
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
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
              <Button onClick={handleSearch} className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Task List */}
        <div className="space-y-4">
          {viewMode === "hierarchy" ? (
            // Render hierarchical view
            hierarchicalTasks.map(task => renderTaskCard(task))
          ) : (
            // Render flat list
            tasks.map(task => renderTaskCard(task))
          )}
        </div>
        
        {tasks.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tasks found matching your filters.</p>
                <Button variant="outline" className="mt-4" onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setPriorityFilter("all")
                  fetchTasks()
                }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        description={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone and will permanently remove the task and all its associated data.`}
        loading={deleting}
      />
    </MainLayout>
  )
}