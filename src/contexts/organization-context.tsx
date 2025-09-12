// contexts/organization-context.tsx
"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"

interface Organization {
  id: string
  name: string
  description?: string
}

interface OrganizationContextType {
  currentOrganization: Organization | null
  organizations: Organization[]
  isLoading: boolean
  setCurrentOrganization: (org: Organization) => void
  refreshOrganizations: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrganizations = async () => {
    if (!session) return
    
    try {
      setIsLoading(true)
      const response = await fetch("/api/organizations")
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
        
        // Check if we're on an organization page
        const orgMatch = pathname.match(/\/organizations\/([^\/]+)/)
        
        if (orgMatch && orgMatch[1]) {
          const orgFromUrl = data.find((org: Organization) => org.id === orgMatch[1])
          if (orgFromUrl) {
            setCurrentOrganizationState(orgFromUrl)
            return
          }
        }
        
        // Default to first organization if no match in URL
        if (data.length > 0 && !currentOrganization) {
          setCurrentOrganizationState(data[0])
        }
      }
    } catch (error) {
      console.error("Error fetching organizations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const setCurrentOrganization = (org: Organization) => {
    setCurrentOrganizationState(org)
  }

  const refreshOrganizations = async () => {
    await fetchOrganizations()
  }

  useEffect(() => {
    if (session) {
      fetchOrganizations()
    } else {
      setOrganizations([])
      setCurrentOrganizationState(null)
      setIsLoading(false)
    }
  }, [session, pathname])

  return (
    <OrganizationContext.Provider value={{
      currentOrganization,
      organizations,
      isLoading,
      setCurrentOrganization,
      refreshOrganizations
    }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider")
  }
  return context
}