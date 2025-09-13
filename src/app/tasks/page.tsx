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
  Paperclip,
  Layers,
  Target,
  Flag,
  Users,
  Tag,
  BarChart3
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
import { Progress } from "@/components/ui/progress"

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
  const [sortBy, setSortBy] = useState<"priority" | "dueDate" | "status">("priority")
  
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
      case "OPEN": return "bg-slate-100 text-slate-800 border-slate-200"
      case "IN_PROGRESS": return "bg-blue-50 text-blue-800 border-blue-200"
      case "REVIEW": return "bg-amber-50 text-amber-800 border-amber-200"
      case "DONE": return "bg-emerald-50 text-emerald-800 border-emerald-200"
      case "CLOSED": return "bg-slate-100 text-slate-800 border-slate-200"
      default: return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW": return "bg-emerald-50 text-emerald-800 border-emerald-200"
      case "MEDIUM": return "bg-amber-50 text-amber-800 border-amber-200"
      case "HIGH": return "bg-orange-50 text-orange-800 border-orange-200"
      case "URGENT": return "bg-rose-50 text-rose-800 border-rose-200"
      default: return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN": return <Circle className="h-4 w-4 text-slate-500" />
      case "IN_PROGRESS": return <Clock className="h-4 w-4 text-blue-500" />
      case "REVIEW": return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "DONE": return <CheckCircle className="h-4 w-4 text-emerald-500" />
      default: return <Circle className="h-4 w-4 text-slate-500" />
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "LOW": return <Flag className="h-4 w-4 text-emerald-500" />
      case "MEDIUM": return <Flag className="h-4 w-4 text-amber-500" />
      case "HIGH": return <Flag className="h-4 w-4 text-orange-500" />
      case "URGENT": return <Flag className="h-4 w-4 text-rose-500" />
      default: return <Flag className="h-4 w-4 text-slate-500" />
    }
  }

  // Calculate task completion percentage
  const calculateProgress = (task: Task) => {
    if (task.subtasks.length === 0) {
      return task.status === "DONE" ? 100 : 0;
    }
    
    const completedSubtasks = task.subtasks.filter(subtask => subtask.status === "DONE").length;
    return Math.round((completedSubtasks / task.subtasks.length) * 100);
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

  // Sort tasks based on selected criteria
  const sortTasks = (tasks: Task[]) => {
    const priorityOrder = { "URGENT": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3 }
    const statusOrder = { "OPEN": 0, "IN_PROGRESS": 1, "REVIEW": 2, "DONE": 3, "CLOSED": 4 }
    
    return [...tasks].sort((a, b) => {
      if (sortBy === "priority") {
        return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
      } else if (sortBy === "dueDate") {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      } else if (sortBy === "status") {
        return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]
      }
      return 0
    })
  }

  // Enhanced renderTaskCard function with premium hierarchy design
  const renderTaskCard = (task: Task & { children?: Task[] }, level = 0) => {
    const isExpanded = expandedTasks.has(task.id)
    const hasChildren = task.children && task.children.length > 0
    const progress = calculateProgress(task)
    
    // Calculate indentation based on level
    const indentWidth = level * 32
    
    return (
      <div key={task.id} className="space-y-3">
        <Card 
          className={`hover:shadow-lg transition-all duration-300 overflow-hidden border-0 shadow-sm ${
            level === 0 ? 'bg-gradient-to-br from-white to-slate-50' : 'bg-white'
          }`}
        >
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex-1 space-y-4">
                {/* Hierarchy connector and title section */}
                <div className="flex items-start gap-3">
                  {/* Hierarchy connector and expand/collapse button */}
                  <div className="flex flex-col items-center mt-1">
                    {level > 0 && (
                      <div className="h-6 w-px bg-slate-200"></div>
                    )}
                    {hasChildren && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 rounded-full bg-slate-100 hover:bg-slate-200"
                        onClick={() => toggleTaskExpansion(task.id)}
                      >
                        {isExpanded ?
                          <ChevronDown className="h-4 w-4 text-slate-600" /> :
                          <ChevronRight className="h-4 w-4 text-slate-600" />
                        }
                      </Button>
                    )}
                    {!hasChildren && level > 0 && (
                      <div className="h-7 w-7 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Status icon and title */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xl tracking-tight">{task.title}</h3>
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {getPriorityIcon(task.priority)}
                            <span className="ml-1">{task.priority}</span>
                          </Badge>
                        </div>
                        
                        {hasChildren && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 font-medium">
                              {task.children?.length} subtask{task.children?.length !== 1 ? 's' : ''}
                            </span>
                            <div className="w-24">
                              <Progress value={progress} className="h-1.5" />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">{progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Parent task info for subtasks */}
                    {level > 0 && task.parentTask && (
                      <div className="flex items-center gap-1 text-sm text-slate-500 mt-2 ml-7">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Subtask of: {task.parentTask.title}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-slate-600 text-sm line-clamp-2 ml-10">
                  {task.description}
                </p>
                
                <div className="flex flex-wrap gap-2 ml-10">
                  <Badge variant="outline" className={getStatusColor(task.status)}>
                    {task.status.replace("_", " ")}
                  </Badge>
                  {task.taskTags.map((taskTag, index) => (
                    <Badge key={index} variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                      <Tag className="h-3 w-3 mr-1" />
                      {taskTag.tag.name}
                    </Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm ml-10">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-slate-500" />
                    <span className="font-medium text-slate-700">
                      {task.project?.name || "No project"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className={task.dueDate && new Date(task.dueDate) < new Date() ? "text-rose-600 font-medium" : "text-slate-700"}>
                      {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "No due date"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" />
                    <div className="flex items-center gap-1">
                      {task.assignees && task.assignees.length > 0 ? (
                        <>
                          <div className="flex -space-x-2">
                            {task.assignees.slice(0, 3).map((assignee, index) => (
                              <Avatar key={assignee.user.id} className="h-6 w-6 border-2 border-white">
                                <AvatarImage src={assignee.user.avatar || ""} />
                                <AvatarFallback className="text-xs bg-slate-100 text-slate-700">
                                  {assignee.user.name?.charAt(0) || assignee.user.email.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          {task.assignees.length > 3 && (
                            <span className="text-xs text-slate-500 font-medium">
                              +{task.assignees.length - 3} more
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-500">Unassigned</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-700">{task._count.comments} comments</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-700">{task._count.attachments} attachments</span>
                  </div>
                </div>
                
                {/* Quick status change buttons */}
                <div className="flex flex-wrap gap-2 pt-2 ml-10">
                  <Button
                    size="sm"
                    variant={task.status === "OPEN" ? "default" : "outline"}
                    onClick={() => handleStatusChange(task.id, "OPEN")}
                    className="text-xs"
                  >
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant={task.status === "IN_PROGRESS" ? "default" : "outline"}
                    onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}
                    className="text-xs"
                  >
                    In Progress
                  </Button>
                  <Button
                    size="sm"
                    variant={task.status === "REVIEW" ? "default" : "outline"}
                    onClick={() => handleStatusChange(task.id, "REVIEW")}
                    className="text-xs"
                  >
                    Review
                  </Button>
                  <Button
                    size="sm"
                    variant={task.status === "DONE" ? "default" : "outline"}
                    onClick={() => handleStatusChange(task.id, "DONE")}
                    className="text-xs"
                  >
                    Done
                  </Button>
                  <Button
                    size="sm"
                    variant={task.status === "CLOSED" ? "default" : "outline"}
                    onClick={() => handleStatusChange(task.id, "CLOSED")}
                    className="text-xs"
                  >
                    Closed
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" asChild className="text-sm">
                  <Link href={`/tasks/${task.id}`}>View Details</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/tasks/${task.id}/edit`}>Edit Task</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Duplicate Task</DropdownMenuItem>
                    <DropdownMenuItem>Add Subtask</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-rose-600"
                      onClick={() => handleDeleteClick(task)}
                    >
                      Delete Task
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
            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200"></div>
            
            <div className="ml-6 space-y-3">
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
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-rose-600 text-lg mb-4">{error}</p>
            <Button onClick={fetchTasks}>Retry</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Group tasks by hierarchy and sort them
  const hierarchicalTasks = viewMode === "hierarchy" 
    ? sortTasks(groupTasksByHierarchy(tasks)) 
    : sortTasks(tasks)

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
            <p className="text-slate-500 mt-1">
              Organize, track, and manage all your tasks efficiently
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              List View
            </Button>
            <Button
              variant={viewMode === "hierarchy" ? "default" : "outline"}
              onClick={() => setViewMode("hierarchy")}
              className="gap-2"
            >
              <Layers className="h-4 w-4" />
              Hierarchy View
            </Button>
            <Button asChild className="gap-2">
              <Link href="/tasks/create">
                <Plus className="h-4 w-4" />
                New Task
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Tasks</p>
                  <p className="text-2xl font-bold text-blue-900">{tasks.length}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-800">In Progress</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {tasks.filter(t => t.status === "IN_PROGRESS").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-800">Completed</p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {tasks.filter(t => t.status === "DONE").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-pink-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-rose-800">Overdue</p>
                  <p className="text-2xl font-bold text-rose-900">
                    {tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-rose-600" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search tasks by title, description, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSearch()
                      }
                    }}
                    className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
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
                <SelectTrigger className="w-full lg:w-[180px] bg-slate-50 border-slate-200 focus:bg-white">
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
                <SelectTrigger className="w-full lg:w-[180px] bg-slate-50 border-slate-200 focus:bg-white">
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
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as "priority" | "dueDate" | "status")}
              >
                <SelectTrigger className="w-full lg:w-[180px] bg-slate-50 border-slate-200 focus:bg-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} className="w-full lg:w-auto gap-2">
                <Filter className="h-4 w-4" />
                Apply Filters
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
            hierarchicalTasks.map(task => renderTaskCard(task))
          )}
        </div>
        
        {tasks.length === 0 && !loading && (
          <Card className="border-0 shadow-sm bg-slate-50">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <Target className="h-12 w-12 text-slate-400" />
                </div>
                <p className="text-slate-500 text-lg mb-2">No tasks found</p>
                <p className="text-slate-400 mb-6">Try adjusting your filters or create a new task</p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                    setPriorityFilter("all")
                    fetchTasks()
                  }}>
                    Clear Filters
                  </Button>
                  <Button asChild>
                    <Link href="/tasks/create">
                      <Plus className="mr-2 h-4 w-4" />
                      New Task
                    </Link>
                  </Button>
                </div>
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