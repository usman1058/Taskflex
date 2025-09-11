"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Users, 
  FolderOpen, 
  Users2, 
  Calendar,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus
} from "lucide-react"
import Link from "next/link"

interface OrganizationMember {
  id: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  role: string
  joinedAt: string
}

interface OrganizationProject {
  id: string
  name: string
  key: string
  status: string
  createdAt: string
  _count: {
    tasks: number
    members: number
  }
}

interface OrganizationTeam {
  id: string
  name: string
  status: string
  createdAt: string
  _count: {
    members: number
    tasks: number
  }
}

interface Organization {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  members: OrganizationMember[]
  projects: OrganizationProject[]
  teams: OrganizationTeam[]
  _count: {
    projects: number
    teams: number
    members: number
  }
}

interface ActivityItem {
  id: string
  action: string
  description: string
  timestamp: string
  user: {
    name: string
    avatar?: string
  }
}

interface TaskStats {
  total: number
  completed: number
  inProgress: number
  overdue: number
}

export default function OrganizationDashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0
  })
  
  useEffect(() => {
    if (id) {
      fetchOrganization()
      fetchActivity()
      fetchTaskStats()
    }
  }, [id])
  
  const fetchOrganization = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/organizations/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Organization not found")
        } else if (response.status === 403) {
          setError("Access denied")
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to fetch organization: ${response.status}`)
        }
        return
      }
      
      const organizationData = await response.json()
      setOrganization(organizationData)
    } catch (error) {
      console.error("Error fetching organization:", error)
      setError(error instanceof Error ? error.message : "Failed to load organization. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  const fetchActivity = async () => {
    try {
      // Mock activity data for now
      const mockActivity: ActivityItem[] = [
        {
          id: "1",
          action: "created",
          description: "New project created",
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          user: {
            name: "You",
            avatar: session?.user?.avatar
          }
        },
        {
          id: "2",
          action: "updated",
          description: "Organization settings updated",
          timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
          user: {
            name: "You",
            avatar: session?.user?.avatar
          }
        },
        {
          id: "3",
          action: "joined",
          description: "New member joined organization",
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          user: {
            name: "John Doe",
            avatar: ""
          }
        }
      ]
      setRecentActivity(mockActivity)
    } catch (error) {
      console.error("Error fetching activity:", error)
    }
  }
  
  const fetchTaskStats = async () => {
    try {
      // Mock task stats for now
      setTaskStats({
        total: 42,
        completed: 24,
        inProgress: 12,
        overdue: 6
      })
    } catch (error) {
      console.error("Error fetching task stats:", error)
    }
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }
  
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return formatDate(dateString)
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800"
      case "ARCHIVED": return "bg-gray-100 text-gray-800"
      case "COMPLETED": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }
  
  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER": return "bg-purple-100 text-purple-800"
      case "ADMIN": return "bg-blue-100 text-blue-800"
      case "MANAGER": return "bg-green-100 text-green-800"
      case "MEMBER": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }
  
  const getUserRole = () => {
    if (!organization || !session?.user?.id) return null
    
    const member = organization.members.find(m => m.user.id === session.user.id)
    return member ? member.role : null
  }
  
  const userRole = getUserRole()
  const isAdmin = session?.user?.role === "ADMIN"
  const canCreate = isAdmin || (userRole && (userRole === "OWNER" || userRole === "ADMIN" || userRole === "MANAGER"))
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    )
  }
  
  if (error || !organization) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error || "Organization not found"}</p>
            <Button asChild>
              <Link href="/organizations">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Organizations
              </Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }
  
  const completionPercentage = Math.round((taskStats.completed / taskStats.total) * 100)
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/organizations/${id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
              <p className="text-muted-foreground">
                Organization Dashboard
              </p>
            </div>
          </div>
          
          {canCreate && (
            <div className="flex gap-2">
              <Button asChild>
                <Link href={`/projects/create`}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/teams/create`}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Team
                </Link>
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organization._count.projects}</div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organization._count.teams}</div>
              <p className="text-xs text-muted-foreground">
                +1 from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organization._count.members}</div>
              <p className="text-xs text-muted-foreground">
                +3 from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionPercentage}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="projects" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="teams">Teams</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="projects" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      Recent Projects
                    </CardTitle>
                    <CardDescription>
                      Projects in this organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {organization.projects.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No projects in this organization</p>
                        {canCreate && (
                          <Button className="mt-2" asChild>
                            <Link href="/projects/create">
                              <Plus className="mr-2 h-4 w-4" />
                              Create Project
                            </Link>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {organization.projects.slice(0, 5).map(project => (
                          <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h3 className="font-medium">{project.name}</h3>
                              <p className="text-sm text-muted-foreground">Key: {project.key}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(project.status)}>
                                {project.status}
                              </Badge>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/projects/${project.id}`}>
                                  View
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                        {organization.projects.length > 5 && (
                          <div className="text-center pt-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/organizations/${organization.id}`}>
                                View All Projects
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="teams" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users2 className="h-5 w-5" />
                      Recent Teams
                    </CardTitle>
                    <CardDescription>
                      Teams in this organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {organization.teams.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No teams in this organization</p>
                        {canCreate && (
                          <Button className="mt-2" asChild>
                            <Link href="/teams/create">
                              <Plus className="mr-2 h-4 w-4" />
                              Create Team
                            </Link>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {organization.teams.slice(0, 5).map(team => (
                          <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h3 className="font-medium">{team.name}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(team.status)}>
                                {team.status}
                              </Badge>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/teams/${team.id}`}>
                                  View
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                        {organization.teams.length > 5 && (
                          <div className="text-center pt-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/organizations/${organization.id}`}>
                                View All Teams
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Recent actions in this organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.length > 0 ? (
                        recentActivity.map(activity => (
                          <div key={activity.id} className="flex items-start space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={activity.user.avatar} />
                              <AvatarFallback>
                                {activity.user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{activity.user.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {formatRelativeTime(activity.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm">
                                {activity.action} {activity.description}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">No recent activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Task Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Completed</span>
                    </div>
                    <span className="font-medium">{taskStats.completed}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>In Progress</span>
                    </div>
                    <span className="font-medium">{taskStats.inProgress}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span>Overdue</span>
                    </div>
                    <span className="font-medium">{taskStats.overdue}</span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <div className="text-sm text-muted-foreground">
                    Total tasks: {taskStats.total}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {organization.members.slice(0, 5).map(member => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.user.avatar} />
                          <AvatarFallback>
                            {member.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.user.name}</p>
                          <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        </div>
                      </div>
                      <Badge className={getRoleColor(member.role)}>
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                  {organization.members.length > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/organizations/${organization.id}`}>
                          View All Members
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {canCreate && (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/projects/create`}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Project
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/teams/create`}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Team
                      </Link>
                    </Button>
                  </>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/organizations/${organization.id}/settings`}>
                    Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}