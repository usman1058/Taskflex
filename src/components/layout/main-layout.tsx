// components/layout/main-layout.tsx
"use client"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { cn } from "@/lib/utils"
import { OrganizationProvider, useOrganization } from "@/contexts/organization-context"
interface MainLayoutProps {
  children: React.ReactNode
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { currentOrganization } = useOrganization()
  
  useEffect(() => {
    if (status === "loading") return // Still loading
    if (!session) router.push("/auth/signin")
  }, [session, status, router])
  
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (!session) {
    return null
  }
  
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed)
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen)
  const closeMobileSidebar = () => setMobileSidebarOpen(false)
  
  // Check if we're on an organization page
  const isOrganizationPage = pathname.startsWith("/organizations/") && 
                             pathname.split("/").length > 2
  
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={toggleSidebar}
          isMobile={false}
          onClose={() => {}}
        />
      </div>
      
      {/* Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div className="md:hidden">
          <Sidebar 
            isCollapsed={false} 
            onToggle={toggleSidebar}
            isMobile={true}
            onClose={closeMobileSidebar}
          />
        </div>
      )}
      
      {/* Overlay for mobile sidebar */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={closeMobileSidebar}
        />
      )}
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMobileMenuToggle={toggleMobileSidebar}
          currentOrganization={currentOrganization}
          isOrganizationPage={isOrganizationPage}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="w-full h-full px-4 py-6 md:px-6 md:py-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <OrganizationProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </OrganizationProvider>
  )
}