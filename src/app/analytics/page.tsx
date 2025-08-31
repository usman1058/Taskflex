// app/analytics/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Download,
  FileText,
  Activity,
  Target,
  UserCheck
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts"
import { format } from "date-fns"

interface TaskAnalytics {
  tasksByStatus: { status: string; _count: { id: number } }[]
  tasksByPriority: { priority: string; _count: { id: number } }[]
  tasksByProject: {
    projectId: string;
    _count: { id: number };
    project?: { id: string; name: string; key: string }
  }[]
  tasksByMonth: { month: string; completedTasks: number }[]
  tasksByType: { type: string; _count: { id: number } }[]
}

interface ProductivityAnalytics {
  weeklyProductivity: {
    week: string;
    weekStart: string;
    weekEnd: string;
    dailyCompletions: { day: string; date: string; completedTasks: number }[];
    weekTotal: number;
  }[]
  avgCompletionTime: number
  currentStreak: number
  totalCompleted: number
}

interface TeamAnalytics {
  teamProductivity: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    assignedTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
  }[]
  projectStatus: { status: string; _count: { id: number } }[]
  tasksByAssignee: {
    assigneeId: string;
    _count: { id: number };
    assignee?: { id: string; name: string | null; email: string }
  }[]
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [taskAnalytics, setTaskAnalytics] = useState<TaskAnalytics | null>(null)
  const [productivityAnalytics, setProductivityAnalytics] = useState<ProductivityAnalytics | null>(null)
  const [teamAnalytics, setTeamAnalytics] = useState<TeamAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("6")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("tasks")
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchUser()
    fetchTaskAnalytics()
    fetchProductivityAnalytics()
    fetchTeamAnalytics()
  }, [timeRange])

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/user/profile")
      if (response.ok) {
        const userData = await response.json()
        setUserRole(userData.role)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const fetchTaskAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics/tasks?months=${timeRange}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch task analytics: ${response.status}`)
      }
      const data = await response.json()
      setTaskAnalytics(data)
    } catch (error) {
      console.error("Error fetching task analytics:", error)
      setError("Failed to load task analytics. Please try again.")
    }
  }

  const fetchProductivityAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics/productivity?weeks=${timeRange}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch productivity analytics: ${response.status}`)
      }
      const data = await response.json()
      setProductivityAnalytics(data)
    } catch (error) {
      console.error("Error fetching productivity analytics:", error)
      setError("Failed to load productivity analytics. Please try again.")
    }
  }

  const fetchTeamAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics/team")
      if (!response.ok) {
        // If unauthorized, just ignore team analytics
        if (response.status === 401) return
        throw new Error(`Failed to fetch team analytics: ${response.status}`)
      }
      const data = await response.json()
      setTeamAnalytics(data)
    } catch (error) {
      console.error("Error fetching team analytics:", error)
      setError("Failed to load team analytics. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = async () => {
    setExporting(true)
    try {
      let csvContent = ""
      let filename = ""
      
      if (activeTab === "tasks" && taskAnalytics) {
        // Export tasks analytics
        filename = `tasks-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`
        
        // Tasks by Status
        csvContent += "Tasks by Status\n"
        csvContent += "Status,Count\n"
        taskAnalytics.tasksByStatus.forEach(item => {
          csvContent += `${item.status},${item._count.id}\n`
        })
        csvContent += "\n"
        
        // Tasks by Priority
        csvContent += "Tasks by Priority\n"
        csvContent += "Priority,Count\n"
        taskAnalytics.tasksByPriority.forEach(item => {
          csvContent += `${item.priority},${item._count.id}\n`
        })
        csvContent += "\n"
        
        // Tasks by Project
        csvContent += "Tasks by Project\n"
        csvContent += "Project Name,Project Key,Count\n"
        taskAnalytics.tasksByProject.forEach(item => {
          csvContent += `"${item.project?.name || "Unknown"}","${item.project?.key || ""}",${item._count.id}\n`
        })
        csvContent += "\n"
        
        // Tasks by Type
        csvContent += "Tasks by Type\n"
        csvContent += "Type,Count\n"
        taskAnalytics.tasksByType.forEach(item => {
          csvContent += `${item.type},${item._count.id}\n`
        })
        csvContent += "\n"
        
        // Tasks by Month
        csvContent += "Tasks Completed by Month\n"
        csvContent += "Month,Completed Tasks\n"
        taskAnalytics.tasksByMonth.forEach(item => {
          csvContent += `${item.month},${item.completedTasks}\n`
        })
      } 
      else if (activeTab === "productivity" && productivityAnalytics) {
        // Export productivity analytics
        filename = `productivity-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`
        
        // Summary
        csvContent += "Productivity Summary\n"
        csvContent += `Average Completion Time (days),${productivityAnalytics.avgCompletionTime}\n`
        csvContent += `Current Streak (days),${productivityAnalytics.currentStreak}\n`
        csvContent += `Total Completed Tasks,${productivityAnalytics.totalCompleted}\n`
        csvContent += "\n"
        
        // Weekly Productivity
        csvContent += "Weekly Productivity\n"
        csvContent += "Week,Week Start,Week End,Total Completed\n"
        productivityAnalytics.weeklyProductivity.forEach(week => {
          csvContent += `${week.week},${week.weekStart},${week.weekEnd},${week.weekTotal}\n`
        })
        csvContent += "\n"
        
        // Daily Productivity (for the most recent week)
        if (productivityAnalytics.weeklyProductivity.length > 0) {
          csvContent += "Daily Productivity\n"
          csvContent += "Day,Date,Completed Tasks\n"
          productivityAnalytics.weeklyProductivity[0].dailyCompletions.forEach(day => {
            csvContent += `${day.day},${day.date},${day.completedTasks}\n`
          })
        }
      } 
      else if (activeTab === "team" && teamAnalytics) {
        // Export team analytics
        filename = `team-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`
        
        // Team Productivity
        csvContent += "Team Productivity\n"
        csvContent += "Name,Email,Assigned Tasks,Completed Tasks,Overdue Tasks,Completion Rate\n"
        teamAnalytics.teamProductivity.forEach(member => {
          csvContent += `"${member.name || ""}","${member.email}",${member.assignedTasks},${member.completedTasks},${member.overdueTasks},${member.completionRate}%\n`
        })
        csvContent += "\n"
        
        // Project Status
        csvContent += "Project Status\n"
        csvContent += "Status,Count\n"
        teamAnalytics.projectStatus.forEach(item => {
          csvContent += `${item.status},${item._count.id}\n`
        })
        csvContent += "\n"
        
        // Tasks by Assignee
        csvContent += "Tasks by Assignee\n"
        csvContent += "Assignee,Task Count\n"
        teamAnalytics.tasksByAssignee.forEach(item => {
          csvContent += `"${item.assignee?.name || item.assignee?.email || "Unknown"}",${item._count.id}\n`
        })
      }
      
      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      
      // Create a download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error exporting data:", error)
      setError("Failed to export data. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "#94a3b8"    // slate-500
      case "IN_PROGRESS": return "#3b82f6"  // blue-500
      case "REVIEW": return "#f59e0b"      // amber-500
      case "DONE": return "#10b981"        // emerald-500
      case "CLOSED": return "#8b5cf6"      // violet-500
      case "CANCELLED": return "#ef4444"   // red-500
      default: return "#94a3b8"           // slate-500
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW": return "#94a3b8"    // slate-500
      case "MEDIUM": return "#3b82f6"  // blue-500
      case "HIGH": return "#f97316"    // orange-500
      case "URGENT": return "#ef4444"  // red-500
      default: return "#94a3b8"        // slate-500
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "TASK": return "#3b82f6"    // blue-500
      case "BUG": return "#ef4444"     // red-500
      case "STORY": return "#10b981"   // emerald-500
      case "EPIC": return "#8b5cf6"    // violet-500
      case "SUBTASK": return "#94a3b8" // slate-500
      default: return "#94a3b8"        // slate-500
    }
  }

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "#10b981"   // emerald-500
      case "ARCHIVED": return "#94a3b8" // slate-500
      case "COMPLETED": return "#3b82f6" // blue-500
      default: return "#94a3b8"         // slate-500
    }
  }

  const formatChartData = (data: any[], key: string, valueKey: string) => {
    return data.map(item => ({
      name: item[key],
      value: item._count[valueKey]
    }))
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
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Track your productivity and team performance
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={exportToCSV}
              disabled={exporting}
              className="flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export CSV
                </>
              )}
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="productivity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Productivity
            </TabsTrigger>
            {(userRole === "MANAGER" || userRole === "ADMIN") && (
              <TabsTrigger value="team" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Team
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="tasks" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Tasks</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {taskAnalytics?.tasksByStatus.reduce((sum, item) => sum + item._count.id, 0) || 0}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Tasks you're involved in
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Completed Tasks</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {taskAnalytics?.tasksByStatus.find(s => s.status === "DONE")?._count.id || 0}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Tasks marked as done
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">In Progress</CardTitle>
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                    {taskAnalytics?.tasksByStatus.find(s => s.status === "IN_PROGRESS")?._count.id || 0}
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Tasks currently in progress
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Overdue</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {taskAnalytics?.tasksByStatus.find(s => s.status === "OPEN")?._count.id || 0}
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Tasks that need attention
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Tasks by Status
                  </CardTitle>
                  <CardDescription>
                    Distribution of tasks by their current status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={taskAnalytics?.tasksByStatus.map(item => ({
                            name: item.status,
                            value: item._count.id
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {taskAnalytics?.tasksByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Tasks by Priority
                  </CardTitle>
                  <CardDescription>
                    Distribution of tasks by their priority level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={taskAnalytics?.tasksByPriority.map(item => ({
                            name: item.priority,
                            value: item._count.id
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {taskAnalytics?.tasksByPriority.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getPriorityColor(entry.priority)} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Tasks by Project
                  </CardTitle>
                  <CardDescription>
                    Top 5 projects with the most tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={taskAnalytics?.tasksByProject.map(item => ({
                          name: item.project?.name || "Unknown",
                          value: item._count.id
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Tasks by Type
                  </CardTitle>
                  <CardDescription>
                    Distribution of tasks by their type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={taskAnalytics?.tasksByType.map(item => ({
                            name: item.type,
                            value: item._count.id
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {taskAnalytics?.tasksByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getTypeColor(entry.type)} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Task Completion Trend
                </CardTitle>
                <CardDescription>
                  Number of tasks completed per month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={taskAnalytics?.tasksByMonth}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="completedTasks" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="productivity" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="shadow-sm border-0 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/50 dark:to-indigo-900/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Completion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                    {taskAnalytics?.tasksByStatus.length 
                      ? Math.round(
                          (taskAnalytics.tasksByStatus.find(s => s.status === "DONE")?._count.id || 0) /
                          taskAnalytics.tasksByStatus.reduce((sum, item) => sum + item._count.id, 0) * 100
                        ) 
                      : 0}%
                  </div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">
                    Of your total tasks
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Avg. Completion Time</CardTitle>
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {productivityAnalytics?.avgCompletionTime || 0} days
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    From creation to completion
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Current Streak</CardTitle>
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {productivityAnalytics?.currentStreak || 0} days
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Consecutive days with completed tasks
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-0 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/50 dark:to-cyan-900/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-cyan-700 dark:text-cyan-300">Total Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">
                    {productivityAnalytics?.totalCompleted || 0}
                  </div>
                  <p className="text-xs text-cyan-600 dark:text-cyan-400">
                    Tasks you've completed
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Weekly Productivity
                </CardTitle>
                <CardDescription>
                  Number of tasks completed per week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={productivityAnalytics?.weeklyProductivity.map(week => ({
                        name: week.week,
                        value: week.weekTotal
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {productivityAnalytics?.weeklyProductivity && productivityAnalytics.weeklyProductivity.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Daily Productivity
                  </CardTitle>
                  <CardDescription>
                    Tasks completed each day of the week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={productivityAnalytics.weeklyProductivity[0].dailyCompletions}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="completedTasks" stroke="#10b981" activeDot={{ r: 8 }} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {(userRole === "MANAGER" || userRole === "ADMIN") && teamAnalytics && (
            <TabsContent value="team" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm border-0 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/50 dark:to-violet-900/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-300">Team Members</CardTitle>
                    <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-violet-900 dark:text-violet-100">
                      {teamAnalytics.teamProductivity.length}
                    </div>
                    <p className="text-xs text-violet-600 dark:text-violet-400">
                      Active team members
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm border-0 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/50 dark:to-teal-900/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-teal-700 dark:text-teal-300">Avg. Completion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                      {Math.round(
                        teamAnalytics.teamProductivity.reduce((sum, member) => sum + member.completionRate, 0) / 
                        teamAnalytics.teamProductivity.length
                      )}%
                    </div>
                    <p className="text-xs text-teal-600 dark:text-teal-400">
                      Team average completion rate
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm border-0 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/50 dark:to-rose-900/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-300">Overdue Tasks</CardTitle>
                    <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-rose-900 dark:text-rose-100">
                      {teamAnalytics.teamProductivity.reduce((sum, member) => sum + member.overdueTasks, 0)}
                    </div>
                    <p className="text-xs text-rose-600 dark:text-rose-400">
                      Tasks that need attention
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm border-0 bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/50 dark:to-sky-900/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-sky-700 dark:text-sky-300">Active Projects</CardTitle>
                    <BarChart3 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-sky-900 dark:text-sky-100">
                      {teamAnalytics.projectStatus.find(s => s.status === "ACTIVE")?._count.id || 0}
                    </div>
                    <p className="text-xs text-sky-600 dark:text-sky-400">
                      Currently active projects
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Team Productivity
                  </CardTitle>
                  <CardDescription>
                    Completion rate for each team member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={teamAnalytics.teamProductivity.map(member => ({
                          name: member.name || member.email,
                          completionRate: member.completionRate
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                        <Legend />
                        <Bar dataKey="completionRate" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Project Status
                    </CardTitle>
                    <CardDescription>
                      Distribution of projects by status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={teamAnalytics.projectStatus.map(item => ({
                              name: item.status,
                              value: item._count.id
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {teamAnalytics.projectStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getProjectStatusColor(entry.status)} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Tasks by Assignee
                    </CardTitle>
                    <CardDescription>
                      Top 5 assignees by task count
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={teamAnalytics.tasksByAssignee.map(item => ({
                            name: item.assignee?.name || item.assignee?.email || "Unknown",
                            value: item._count.id
                          }))}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={100} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Team Members
                  </CardTitle>
                  <CardDescription>
                    Productivity overview for each team member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamAnalytics.teamProductivity.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar || ""} />
                            <AvatarFallback>
                              {member.name?.charAt(0) || member.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name || member.email}</p>
                            {member.name && (
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Assigned</p>
                            <p className="font-medium">{member.assignedTasks}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Completed</p>
                            <p className="font-medium">{member.completedTasks}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Overdue</p>
                            <p className="font-medium">{member.overdueTasks}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Rate</p>
                            <Badge variant={member.completionRate >= 80 ? "default" : "destructive"}>
                              {member.completionRate}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
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