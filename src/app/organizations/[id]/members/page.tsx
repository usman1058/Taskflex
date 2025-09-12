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
  Filter
} from "lucide-react"
import Link from "next/link"
import { UserCard } from "@/components/user/user-card"
import { UserStats } from "@/components/user/user-stats"
import { UserActivity } from "@/components/user/user-activity"
import { UserTeams } from "@/components/user/user-teams"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"

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
  const canManage = isAdmin || (userRole && (userRole === "OWNER" || userRole === "ADMIN" || userRole === "MANAGER"))
  
  const filteredMembers = organization?.members.filter(member => {
    const matchesSearch = member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "ALL" || member.role === roleFilter
    
    return matchesSearch && matchesRole
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
      }
    } catch (error) {
      console.error("Error updating member role:", error)
    }
  }
  
  const handleRemoveMember = async (memberId: string) => {
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
      }
    } catch (error) {
      console.error("Error removing member:", error)
    }
  }
  
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
            <Button asChild>
              <Link href={`/organizations/${id}/invite`}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Link>
            </Button>
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
                </div>
              </CardContent>
            </Card>
            
            {/* Members List */}
            <div className="grid gap-4 md:grid-cols-2">
              {filteredMembers.length > 0 ? (
                filteredMembers.map(member => (
                  <UserCard 
                    key={member.id}
                    user={member.user}
                    showActions={canManage}
                    onChangeRole={canManage ? handleRoleChange : undefined}
                    onRemove={canManage ? handleRemoveMember : undefined}
                  />
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
                          <Badge className={
                            selectedMemberData.user.status === "ACTIVE" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }>
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
                
                {/* User Stats */}
                <UserStats userId={selectedMemberData.user.id} />
                
                {/* User Activity */}
                <UserActivity userId={selectedMemberData.user.id} />
                
                {/* User Teams */}
                <UserTeams userId={selectedMemberData.user.id} />
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