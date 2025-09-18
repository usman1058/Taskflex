// app/organizations/[id]/members/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ArrowLeft, 
  Users, 
  UserPlus,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreHorizontal,
  Filter,
  Settings,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  User
} from "lucide-react"
import Link from "next/link"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from "@/components/ui/dropdown-menu"
import InviteMemberDialog from "@/components/organizations/invite-member-dialog"

interface OrganizationMember {
  id: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
    status: string
    bio?: string
    location?: string
    createdAt: string
  }
  role: string
  joinedAt: string
}

interface Organization {
  id: string
  name: string
  description: string | null
  type: string
  industry: string | null
  size: string | null
  website: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postalCode: string | null
  timezone: string | null
  avatar: string | null
  createdAt: string
  updatedAt: string
  members: OrganizationMember[]
  _count: {
    projects: number
    teams: number
    members: number
  }
}

interface TaskStats {
  total: number
  completed: number
  inProgress: number
  overdue: number
}

export default function OrganizationMembersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null)
  
  useEffect(() => {
    if (id) {
      fetchOrganization()
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
  
  const fetchTaskStats = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/task-stats`)
      if (response.ok) {
        const data = await response.json()
        setTaskStats(data)
      }
    } catch (error) {
      console.error("Error fetching task stats:", error)
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800"
      case "INACTIVE": return "bg-gray-100 text-gray-800"
      case "SUSPENDED": return "bg-red-100 text-red-800"
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
  const canManage = isAdmin || (userRole && (userRole === "OWNER" || userRole === "ADMIN"))
  
  const filteredMembers = organization?.members.filter(member => {
    const matchesSearch = member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "ALL" || member.role === roleFilter
    const matchesStatus = statusFilter === "ALL" || member.user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  }) || []
  
  const selectedMemberData = selectedMember 
    ? organization?.members.find(m => m.id === selectedMember)
    : null
  
  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/organizations/${id}/members/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })
      
      if (response.ok) {
        // Refresh organization data
        fetchOrganization()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update member role")
      }
    } catch (error) {
      console.error("Error updating member role:", error)
      alert("Failed to update member role")
    }
  }
  
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the organization?")) {
      return
    }
    
    try {
      const response = await fetch(`/api/organizations/${id}/members/${memberId}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        // Refresh organization data
        fetchOrganization()
        // Clear selection if removed member was selected
        if (selectedMember === memberId) {
          setSelectedMember(null)
        }
      } else {
        const error = await response.json()
        alert(error.error || "Failed to remove member")
      }
    } catch (error) {
      console.error("Error removing member:", error)
      alert("Failed to remove member")
    }
  }
  
  useEffect(() => {
    if (selectedMemberData) {
      fetchTaskStats(selectedMemberData.user.id)
    }
  }, [selectedMemberData])
  
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
            <div className="mx-auto bg-red-100 text-red-600 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error || "Organization not found"}</p>
            <Button asChild>
              <Link href={`/organizations/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Organization
              </Link>
            </Button>
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/organizations/${id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Members</h1>
              <p className="text-muted-foreground">
                {organization.name} • {organization._count.members} members
              </p>
            </div>
          </div>
          
          {canManage && (
            <InviteMemberDialog organization={organization}>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </InviteMemberDialog>
          )}
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Filters and Search */}
            <Card className="border-none shadow-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-1">
                          <Filter className="h-4 w-4" />
                          {roleFilter === "ALL" ? "All Roles" : roleFilter}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setRoleFilter("ALL")}>
                          All Roles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRoleFilter("OWNER")}>
                          Owner
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRoleFilter("ADMIN")}>
                          Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRoleFilter("MANAGER")}>
                          Manager
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRoleFilter("MEMBER")}>
                          Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-1">
                          <Filter className="h-4 w-4" />
                          {statusFilter === "ALL" ? "All Status" : statusFilter}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setStatusFilter("ALL")}>
                          All Status
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("ACTIVE")}>
                          Active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("INACTIVE")}>
                          Inactive
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("SUSPENDED")}>
                          Suspended
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Members List */}
            <div className="grid gap-4 md:grid-cols-2">
              {filteredMembers.length > 0 ? (
                filteredMembers.map(member => (
                  <Card 
                    key={member.id} 
                    className={`border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                      selectedMember === member.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedMember(member.id === selectedMember ? null : member.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.user.avatar} />
                            <AvatarFallback>
                              {member.user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{member.user.name}</h3>
                            <p className="text-sm text-muted-foreground">{member.user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getRoleColor(member.role)}>
                                {member.role}
                              </Badge>
                              <Badge className={getStatusColor(member.user.status)}>
                                {member.user.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  Change Role
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem onClick={() => handleRoleChange(member.id, "OWNER")}>
                                    Owner
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRoleChange(member.id, "ADMIN")}>
                                    Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRoleChange(member.id, "MANAGER")}>
                                    Manager
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRoleChange(member.id, "MEMBER")}>
                                    Member
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove from Organization
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                        </div>
                        {member.user.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{member.user.location}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No members found</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Selected Member Details */}
          <div className="space-y-6">
            {selectedMemberData ? (
              <>
                {/* Member Info */}
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Member Details</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedMember(null)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedMemberData.user.avatar} />
                        <AvatarFallback className="text-xl">
                          {selectedMemberData.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{selectedMemberData.user.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getRoleColor(selectedMemberData.role)}>
                            {selectedMemberData.role}
                          </Badge>
                          <Badge className={getStatusColor(selectedMemberData.user.status)}>
                            {selectedMemberData.user.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedMemberData.user.email}</span>
                        </div>
                        {selectedMemberData.user.location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedMemberData.user.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Joined {new Date(selectedMemberData.joinedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Role: {selectedMemberData.role}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Member since {new Date(selectedMemberData.joinedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedMemberData.user.bio && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          {selectedMemberData.user.bio}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Task Stats */}
                {taskStats && (
                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Task Overview</CardTitle>
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
                )}
                
                {/* Actions */}
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/users/${selectedMemberData.user.id}`}>
                        <User className="mr-2 h-4 w-4" />
                        View Full Profile
                      </Link>
                    </Button>
                    
                    {canManage && (
                      <Button 
                        variant="outline" 
                        className="w-full text-destructive hover:text-destructive"
                        onClick={() => handleRemoveMember(selectedMemberData.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove from Organization
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-none shadow-sm">
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a member to view details</p>
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