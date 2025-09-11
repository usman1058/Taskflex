"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Plus, 
  Search, 
  Building, 
  Users, 
  FolderOpen, 
  Users2,
  Calendar,
  Loader2,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { useDebounce } from "@/hooks/use-debounce"

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

interface Organization {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  members: OrganizationMember[]
  _count: {
    projects: number
    teams: number
    members: number
  }
}

export default function OrganizationsPage() {
  const { data: session } = useSession()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  
  useEffect(() => {
    fetchOrganizations()
  }, [debouncedSearchTerm])
  
  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm)
      
      const queryString = params.toString()
      const url = `/api/organizations${queryString ? `?${queryString}` : ""}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch organizations: ${response.status}`)
      }
      
      const organizationsData = await response.json()
      setOrganizations(organizationsData)
    } catch (error) {
      console.error("Error fetching organizations:", error)
      setError("Failed to load organizations. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
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
  
  // Check if user can create organizations
  const canCreateOrganization = session?.user?.role === "ADMIN"
  
  // Check if user has any organization with owner/admin role
  const hasOrganizationWithCreatePermission = organizations.some(org => {
    const member = org.members.find(m => m.user.id === session?.user?.id)
    return member && (member.role === "OWNER" || member.role === "ADMIN")
  })
  
  // Show create button if user is admin OR has no organizations
  const showCreateButton = canCreateOrganization || organizations.length === 0
  
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
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-destructive text-lg mb-4">{error}</p>
            <Button onClick={fetchOrganizations}>Retry</Button>
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
            <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
            <p className="text-muted-foreground">
              {organizations.length > 0 
                ? `You have ${organizations.length} organization${organizations.length !== 1 ? 's' : ''}`
                : "Create your first organization to get started"
              }
            </p>
          </div>
          
          {/* Show create button if user has permission or no organizations */}
          {showCreateButton && (
            <Button asChild>
              <Link href="/organizations/create">
                <Plus className="mr-2 h-4 w-4" />
                New Organization
              </Link>
            </Button>
          )}
        </div>
        
        {/* Empty State - No Organizations */}
        {organizations.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Building className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">No Organizations Yet</h3>
                  <p className="text-muted-foreground mt-1 max-w-md">
                    Get started by creating your first organization. Organizations help you manage teams, projects, and tasks more efficiently.
                  </p>
                </div>
                
                {/* Show create button for all users who have no organizations */}
                <Button asChild>
                  <Link href="/organizations/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Organization
                  </Link>
                </Button>
                
                <p className="text-sm text-muted-foreground">
                  You'll be the owner of this organization and can invite team members later.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Organizations List */}
        {organizations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Your Organizations
              </CardTitle>
              <CardDescription>
                Organizations you're a member of
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {organizations.map((organization) => {
                  // Find the current user's role in this organization
                  const userMember = organization.members.find(m => m.user.id === session?.user?.id)
                  const userRoleInOrg = userMember ? userMember.role : null
                  
                  return (
                    <Card key={organization.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-lg">{organization.name}</h3>
                            {organization.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {organization.description}
                              </p>
                            )}
                            {userRoleInOrg && (
                              <Badge className={getRoleColor(userRoleInOrg)}>
                                {userRoleInOrg}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <FolderOpen className="h-4 w-4" />
                                <span>{organization._count.projects} projects</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users2 className="h-4 w-4" />
                                <span>{organization._count.teams} teams</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{organization._count.members} members</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Created {formatDate(organization.createdAt)}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild className="flex-1">
                              <Link href={`/organizations/${organization.id}`}>
                                View Details
                              </Link>
                            </Button>
                            
                            {/* Show settings button for owners and admins */}
                            {(userRoleInOrg === "OWNER" || userRoleInOrg === "ADMIN") && (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/organizations/${organization.id}/settings`}>
                                  Settings
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Debug information - Remove in production */}
      
      </div>
    </MainLayout>
  )
}