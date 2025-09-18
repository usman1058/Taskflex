"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Search,
  Building,
  Users,
  FolderOpen,
  Users2,
  Calendar,
  Loader2,
  AlertTriangle,
  Filter,
  Globe,
  MapPin,
  Settings,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { useDebounce } from "@/hooks/use-debounce"
import { OrganizationType, OrganizationSize } from "@prisma/client"
import DeleteOrganizationDialog from "@/components/organizations/delete-organization-dialog"

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
  type: OrganizationType
  industry: string | null
  size: OrganizationSize | null
  website: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postalCode: string | null
  timezone: string | null
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
  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  const [sizeFilter, setSizeFilter] = useState<string>("ALL")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  useEffect(() => {
    fetchOrganizations()
  }, [debouncedSearchTerm, typeFilter, sizeFilter])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm)
      if (typeFilter !== "ALL") params.append("type", typeFilter)
      if (sizeFilter !== "ALL") params.append("size", sizeFilter)

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

  // Add the delete function:
  const handleDeleteOrganization = async (orgId: string) => {
    if (!confirm("Are you sure you want to delete this organization? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        // Refresh the organizations list
        fetchOrganizations()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete organization")
      }
    } catch (error) {
      console.error("Error deleting organization:", error)
      alert("Failed to delete organization")
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

  const getTypeColor = (type: OrganizationType) => {
    switch (type) {
      case "COMPANY": return "bg-blue-100 text-blue-800"
      case "NONPROFIT": return "bg-green-100 text-green-800"
      case "EDUCATIONAL": return "bg-purple-100 text-purple-800"
      case "GOVERNMENT": return "bg-red-100 text-red-800"
      case "STARTUP": return "bg-orange-100 text-orange-800"
      case "FREELANCE": return "bg-yellow-100 text-yellow-800"
      case "OTHER": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getSizeLabel = (size: OrganizationSize | null) => {
    if (!size) return "Unknown"
    switch (size) {
      case "SOLO": return "Solo"
      case "SMALL": return "Small"
      case "MEDIUM": return "Medium"
      case "LARGE": return "Large"
      case "ENTERPRISE": return "Enterprise"
      default: return size
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

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="COMPANY">Company</SelectItem>
                    <SelectItem value="NONPROFIT">Nonprofit</SelectItem>
                    <SelectItem value="EDUCATIONAL">Educational</SelectItem>
                    <SelectItem value="GOVERNMENT">Government</SelectItem>
                    <SelectItem value="STARTUP">Startup</SelectItem>
                    <SelectItem value="FREELANCE">Freelance</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sizeFilter} onValueChange={setSizeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Sizes</SelectItem>
                    <SelectItem value="SOLO">Solo</SelectItem>
                    <SelectItem value="SMALL">Small</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LARGE">Large</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

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
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-lg">{organization.name}</h3>
                          {userRoleInOrg && (
                            <Badge className={getRoleColor(userRoleInOrg)}>
                              {userRoleInOrg}
                            </Badge>
                          )}
                        </div>

                        {organization.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {organization.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge className={getTypeColor(organization.type)}>
                            {organization.type}
                          </Badge>
                          {organization.size && (
                            <Badge variant="outline">
                              {getSizeLabel(organization.size)}
                            </Badge>
                          )}
                          {organization.industry && (
                            <Badge variant="secondary">
                              {organization.industry}
                            </Badge>
                          )}
                        </div>
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

                      <div className="space-y-2">
                        {organization.website && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            <span className="truncate">{organization.website}</span>
                          </div>
                        )}

                        {(organization.city || organization.country) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {organization.city && organization.country
                                ? `${organization.city}, ${organization.country}`
                                : organization.city || organization.country}
                            </span>
                          </div>
                        )}
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
                              <Settings className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {/* Show delete button for owners only */}
                        {userRoleInOrg === "OWNER" && (
                          <DeleteOrganizationDialog 
                            organization={organization} 
                            onSuccess={fetchOrganizations}
                          >
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DeleteOrganizationDialog>
                        )}
                        {(userRoleInOrg === "OWNER" || userRoleInOrg === "ADMIN") && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/organizations/${organization.id}/edit`}>
                              Edit
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
        )}
      </div>
    </MainLayout>
  )
}