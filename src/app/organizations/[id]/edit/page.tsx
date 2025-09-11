"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Save, Loader2, Settings, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface Organization {
  id: string
  name: string
  description: string | null
  avatar: string | null
  createdAt: string
  updatedAt: string
  members: Array<{
    user: {
      id: string
      name: string
      email: string
      avatar?: string
    }
    role: string
  }>
}

export default function EditOrganizationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })
  
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
      setFormData({
        name: organizationData.name,
        description: organizationData.description || ""
      })
    } catch (error) {
      console.error("Error fetching organization:", error)
      setError(error instanceof Error ? error.message : "Failed to load organization. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError("Organization name is required")
      return
    }
    
    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update organization")
      }
      
      const updatedOrganization = await response.json()
      setOrganization(updatedOrganization)
      
      // Show success message
      const successMessage = document.createElement("div")
      successMessage.className = "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center"
      successMessage.innerHTML = '<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Organization updated successfully'
      document.body.appendChild(successMessage)
      
      setTimeout(() => {
        document.body.removeChild(successMessage)
      }, 3000)
    } catch (error) {
      console.error("Error updating organization:", error)
      setError(error instanceof Error ? error.message : "Failed to update organization")
    } finally {
      setSaving(false)
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const getUserRole = () => {
    if (!organization || !session?.user?.id) return null
    
    const member = organization.members.find(m => m.user.id === session.user.id)
    return member ? member.role : null
  }
  
  const userRole = getUserRole()
  const isAdmin = session?.user?.role === "ADMIN"
  const canEdit = isAdmin || (userRole && (userRole === "OWNER" || userRole === "ADMIN"))
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
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
  
  if (!canEdit) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">You don't have permission to edit this organization.</p>
            <Button className="mt-4" asChild>
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
      <div className="max-w-3xl mx-auto space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/organizations/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Edit Organization</h1>
            <p className="text-muted-foreground">
              Update organization information
            </p>
          </div>
        </div>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Organization Information
              </CardTitle>
              <CardDescription>
                Update the basic information for your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium">
                  Organization Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter organization name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter organization description"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={`/organizations/${id}`}>
                Cancel
              </Link>
            </Button>
            <Button type="submit" disabled={saving || !formData.name.trim()}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}