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

interface Organization {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
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

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrganizations()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      
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

  const isAdmin = session?.user?.role === "ADMIN"

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
              You have {organizations.length} organization{organizations.length !== 1 ? 's' : ''}
            </p>
          </div>
          {isAdmin && (
            <Button asChild>
              <Link href="/organizations/create">
                <Plus className="mr-2 h-4 w-4" />
                New Organization
              </Link>
            </Button>
          )}
        </div>
        
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
            
            {organizations.length === 0 ? (
              <div className="text-center py-8">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "No organizations match your search."
                    : "No organizations yet. Create your first organization to get started."
                  }
                </p>
                {!searchTerm && isAdmin && (
                  <Button className="mt-4" asChild>
                    <Link href="/organizations/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Organization
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {organizations.map((organization) => (
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