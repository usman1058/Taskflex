// components/layout/organization-switcher.tsx
"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronDown, Plus, Building, Link } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function OrganizationSwitcher() {
  const { data: session } = useSession()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<any[]>([])
  const [currentOrg, setCurrentOrg] = useState<any>(null)
  const [open, setOpen] = useState(false)
  
  useEffect(() => {
    // Fetch organizations
    const fetchOrganizations = async () => {
      try {
        const response = await fetch("/api/organizations")
        if (response.ok) {
          const data = await response.json()
          setOrganizations(data)
          
          // Try to get current organization from URL or use the first one
          const currentPath = window.location.pathname
          const orgMatch = currentPath.match(/\/organizations\/([^\/]+)/)
          
          if (orgMatch && orgMatch[1]) {
            const orgFromUrl = data.find((org: any) => org.id === orgMatch[1])
            if (orgFromUrl) {
              setCurrentOrg(orgFromUrl)
              return
            }
          }
          
          // Default to first organization if no match in URL
          if (data.length > 0) {
            setCurrentOrg(data[0])
          }
        }
      } catch (error) {
        console.error("Error fetching organizations:", error)
      }
    }
    
    if (session) {
      fetchOrganizations()
    }
  }, [session])
  
  const handleOrganizationChange = (org: any) => {
    setCurrentOrg(org)
    setOpen(false)
    
    // Navigate to the organization dashboard
    router.push(`/organizations/${org.id}`)
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-8 p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
                {currentOrg?.name?.charAt(0) || "O"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden md:block">
              {currentOrg?.name || "Personal"}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="p-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1.5">
            Organizations
          </p>
          {organizations.map((org) => (
            <Button
              key={org.id}
              variant="ghost"
              className="w-full justify-start font-normal"
              onClick={() => handleOrganizationChange(org)}
            >
              <Avatar className="h-5 w-5 mr-2">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
                  {org.name?.charAt(0) || "O"}
                </AvatarFallback>
              </Avatar>
              {org.name}
              {currentOrg?.id === org.id && (
                <Check className="ml-auto h-4 w-4" />
              )}
            </Button>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start font-normal"
            asChild
          >
            <Link href="/organizations/create">
              <Plus className="h-4 w-4 mr-2" />
              New Organization
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}