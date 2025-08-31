// app/calendar/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus
} from "lucide-react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns"
import Link from "next/link"

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  backgroundColor: string
  borderColor: string
  extendedProps: {
    description?: string
    status: string
    priority: string
    projectId?: string
    projectName?: string
    projectKey?: string
    assigneeName?: string
    assigneeEmail?: string
  }
}

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate: string
  project?: {
    id: string
    name: string
    key: string
  }
  assignee?: {
    id: string
    name?: string
    email: string
    avatar?: string
  }
}

export default function CalendarPage() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filter, setFilter] = useState("ALL")

  useEffect(() => {
    fetchCalendarEvents()
  }, [currentDate, filter])

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const startDate = startOfMonth(currentDate).toISOString()
      const endDate = endOfMonth(currentDate).toISOString()
      
      const params = new URLSearchParams({
        startDate,
        endDate
      })
      
      const response = await fetch(`/api/calendar?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch calendar events: ${response.status}`)
      }
      
      const eventsData = await response.json()
      
      // Apply filter if needed
      const filteredEvents = filter === "ALL" 
        ? eventsData 
        : eventsData.filter((event: CalendarEvent) => 
            event.extendedProps.priority === filter || 
            event.extendedProps.status === filter
          )
      
      setEvents(filteredEvents)
    } catch (error) {
      console.error("Error fetching calendar events:", error)
      setError("Failed to load calendar events. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event
    setSelectedTask({
      id: event.id,
      title: event.title,
      description: event.extendedProps.description,
      status: event.extendedProps.status,
      priority: event.extendedProps.priority,
      dueDate: event.start,
      project: event.extendedProps.projectId ? {
        id: event.extendedProps.projectId,
        name: event.extendedProps.projectName,
        key: event.extendedProps.projectKey
      } : undefined,
      assignee: event.extendedProps.assigneeEmail ? {
        id: "",
        name: event.extendedProps.assigneeName,
        email: event.extendedProps.assigneeEmail
      } : undefined
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-gray-100 text-gray-800"
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800"
      case "REVIEW": return "bg-yellow-100 text-yellow-800"
      case "DONE": return "bg-green-100 text-green-800"
      case "CLOSED": return "bg-purple-100 text-purple-800"
      case "CANCELLED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW": return "bg-gray-100 text-gray-800"
      case "MEDIUM": return "bg-blue-100 text-blue-800"
      case "HIGH": return "bg-orange-100 text-orange-800"
      case "URGENT": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">
              View your tasks and deadlines in a calendar view
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/tasks/create">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Calendar View
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleToday}>
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {format(currentDate, "MMMM yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <p className="text-destructive text-lg mb-4">{error}</p>
                      <Button onClick={fetchCalendarEvents}>Retry</Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-[600px]">
                    <FullCalendar
                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      headerToolbar={{
                        left: "",
                        center: "",
                        right: ""
                      }}
                      events={events}
                      eventClick={handleEventClick}
                      height="100%"
                      eventDisplay="block"
                      eventTimeFormat={{
                        hour: "numeric",
                        minute: "2-digit",
                        meridiem: "short"
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Priority</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={filter === "ALL" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilter("ALL")}
                    >
                      All
                    </Button>
                    <Button 
                      variant={filter === "URGENT" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilter("URGENT")}
                    >
                      Urgent
                    </Button>
                    <Button 
                      variant={filter === "HIGH" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilter("HIGH")}
                    >
                      High
                    </Button>
                    <Button 
                      variant={filter === "MEDIUM" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilter("MEDIUM")}
                    >
                      Medium
                    </Button>
                    <Button 
                      variant={filter === "LOW" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilter("LOW")}
                    >
                      Low
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Status</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={filter === "OPEN" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilter("OPEN")}
                    >
                      Open
                    </Button>
                    <Button 
                      variant={filter === "IN_PROGRESS" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilter("IN_PROGRESS")}
                    >
                      In Progress
                    </Button>
                    <Button 
                      variant={filter === "REVIEW" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilter("REVIEW")}
                    >
                      Review
                    </Button>
                    <Button 
                      variant={filter === "DONE" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilter("DONE")}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {selectedTask && (
              <Card>
                <CardHeader>
                  <CardTitle>Task Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedTask.title}</h3>
                    {selectedTask.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedTask.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getPriorityColor(selectedTask.priority)}>
                      {selectedTask.priority}
                    </Badge>
                    <Badge className={getStatusColor(selectedTask.status)}>
                      {selectedTask.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Due: {formatDate(selectedTask.dueDate)}</span>
                  </div>
                  
                  {selectedTask.project && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Project: </span>
                      <span className="font-medium">
                        {selectedTask.project.name} ({selectedTask.project.key})
                      </span>
                    </div>
                  )}
                  
                  {selectedTask.assignee && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Assignee:</span>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={selectedTask.assignee.avatar || ""} />
                          <AvatarFallback className="text-xs">
                            {selectedTask.assignee.name?.charAt(0) || selectedTask.assignee.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {selectedTask.assignee.name || selectedTask.assignee.email}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <Button asChild className="w-full">
                      <Link href={`/tasks/${selectedTask.id}`}>
                        View Task Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}