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
  Loader2
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
  assignee: {
    id: string
    name: string
    email: string
    avatar: string | null
  } | null
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

export default function TasksPage() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">
              Manage and track all your tasks in one place
            </p>
          </div>
          <Button asChild>
            <Link href="/tasks/create">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Link>
          </Button>
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
                <SelectTrigger className="w-[180px]">
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
                <SelectTrigger className="w-[180px]">
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
              <Button onClick={handleSearch}>
                <Filter className="mr-2 h-4 w-4" />
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Task List */}
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{task.description}</p>
                    <div className="flex flex-wrap gap-2">
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
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Project: {task.project?.name || "No project"}</span>
                      <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</span>
                      <span>Assignee: {task.assignee?.name || "Unassigned"}</span>
                      <span>Comments: {task._count.comments}</span>
                      <span>Attachments: {task._count.attachments}</span>
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
                        <DropdownMenuItem className="text-red-600">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
    </MainLayout>
  )
}