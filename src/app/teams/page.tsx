// app/teams/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Users, 
  Search, 
  UserPlus,
  Settings,
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react"
import CreateTeamDialog from "@/components/teams/create-team-dialog"
import InviteMemberDialog from "@/components/teams/invite-member-dialog"
import Link from "next/link"
import { format } from "date-fns"

interface Team {
  id: string
  name: string
  description: string | null
  avatar: string | null
  status: string
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
  members: {
    id: string
    userId: string
    role: string
    status: string
    user: {
      id: string
      name: string | null
      email: string
      avatar: string | null
    }
  }[]
  _count: {
    members: number
    projects: number
  }
}

export default function TeamsPage() {
  const { data: session } = useSession()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/teams")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.status}`)
      }
      
      const teamsData = await response.json()
      setTeams(teamsData)
    } catch (error) {
      console.error("Error fetching teams:", error)
      setError("Failed to load teams. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER": return "bg-purple-100 text-purple-800"
      case "ADMIN": return "bg-blue-100 text-blue-800"
      case "MEMBER": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800"
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "INACTIVE": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy")
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
            <Button onClick={fetchTeams}>Retry</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
            <p className="text-muted-foreground">
              Manage your teams and collaborations
            </p>
          </div>
          <CreateTeamDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </CreateTeamDialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Teams
            </CardTitle>
            <CardDescription>
              Teams you're a member of
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {teams.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "No teams match your search."
                    : "No teams yet. Create your first team to get started."
                  }
                </p>
                {!searchTerm && (
                  <CreateTeamDialog>
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Team
                    </Button>
                  </CreateTeamDialog>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                  <Card key={team.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{team.name}</h3>
                              <Badge className={getStatusColor(team.status)}>
                                {team.status}
                              </Badge>
                            </div>
                            {team.description && (
                              <p className="text-sm text-muted-foreground">
                                {team.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{team._count.members} members</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Settings className="h-4 w-4" />
                              <span>{team._count.projects} projects</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={team.owner.avatar || ""} />
                              <AvatarFallback>
                                {team.owner.name?.charAt(0) || team.owner.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-xs">
                              <p className="font-medium">Owner</p>
                              <p className="text-muted-foreground">
                                {team.owner.name || team.owner.email}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/teams/${team.id}`}>
                                View
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex -space-x-2">
                          {team.members.slice(0, 5).map((member) => (
                            <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                              <AvatarImage src={member.user.avatar || ""} />
                              <AvatarFallback>
                                {member.user.name?.charAt(0) || member.user.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {team.members.length > 5 && (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                              +{team.members.length - 5}
                            </div>
                          )}
                        </div>
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