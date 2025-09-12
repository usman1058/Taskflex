// components/layout/sidebar.tsx
"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  LayoutDashboard, 
  CheckSquare, 
  Plus, 
  User, 
  Settings, 
  Bell,
  Search,
  FolderOpen,
  Users,
  Calendar,
  BarChart3,
  Tag,
  MessageSquare,
  Clock,
  ChevronLeft,
  ChevronRight,
  Menu,
  Star,
  Home,
  Briefcase,
  Target,
  FileText,
  HelpCircle,
  LogOut
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "Create Task",
    href: "/tasks/create",
    icon: Plus,
  },
  {
    title: "Projects",
    href: "/projects",
    icon: Briefcase,
  },
  {
    title: "Organizations",
    href: "/organizations",
    icon: Home,
  },
  {
    title: "Search",
    href: "/search",
    icon: Search,
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Teams",
    href: "/teams",
    icon: Users,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
    notificationCount: 3, // This would be dynamic
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

const favoriteItems = [
  {
    title: "My Tasks",
    href: "/tasks?filter=assigned",
    icon: CheckSquare,
  },
  {
    title: "Today's Tasks",
    href: "/tasks?filter=today",
    icon: Clock,
  },
  {
    title: "Team Board",
    href: "/teams/current/board",
    icon: Users,
  },
]

interface SidebarProps {
  className?: string
  isCollapsed: boolean
  onToggle: () => void
  isMobile: boolean
  onClose: () => void
}

export function Sidebar({ className, isCollapsed, onToggle, isMobile, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredItems, setFilteredItems] = useState(sidebarNavItems)
  
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems(sidebarNavItems)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = sidebarNavItems.filter(item => 
        item.title.toLowerCase().includes(query)
      )
      setFilteredItems(filtered)
    }
  }, [searchQuery])
  
  const handleLogoClick = () => {
    if (isCollapsed) {
      onToggle()
    } else {
      router.push("/dashboard")
    }
  }
  
  return (
    <TooltipProvider>
      <div className={cn(
        "h-full bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100 border-r border-slate-700 flex flex-col flex-shrink-0 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        isMobile ? "fixed inset-y-0 z-50 shadow-xl" : "relative",
        className
      )}>
        {/* Header Section */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center space-x-2 cursor-pointer" onClick={handleLogoClick}>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-1.5 rounded-lg">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                TaskFlow Pro
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full cursor-pointer" onClick={handleLogoClick}>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-1.5 rounded-lg">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
          {!isCollapsed && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={isMobile ? onClose : onToggle}
              className="ml-auto text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            >
              {isMobile ? (
                <Menu className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        {/* Search Section - Only shown when expanded */}
        {!isCollapsed && (
          <div className="p-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
              />
            </div>
          </div>
        )}
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full py-2">
            <div className="px-3 space-y-6">
              {/* Main Navigation */}
              <div className="space-y-1">
                {!isCollapsed && (
                  <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Main
                  </p>
                )}
                {filteredItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start text-slate-200 hover:text-white hover:bg-slate-800",
                            isActive && "bg-blue-900/30 text-blue-100 hover:bg-blue-900/50",
                            isCollapsed && "justify-center px-2"
                          )}
                          asChild
                        >
                          <Link href={item.href} onClick={isMobile ? onClose : undefined}>
                            <div className="relative">
                              <Icon className={cn(
                                "h-4 w-4",
                                !isCollapsed && "mr-3"
                              )} />
                              {item.notificationCount && (
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600">
                                  {item.notificationCount}
                                </Badge>
                              )}
                            </div>
                            {!isCollapsed && <span>{item.title}</span>}
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )
                })}
              </div>
              
              {/* Favorites Section - Only shown when expanded and no search */}
              {!isCollapsed && searchQuery === "" && (
                <div className="space-y-1">
                  <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                    <Star className="h-3 w-3 mr-1" /> Favorites
                  </p>
                  {favoriteItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    
                    return (
                      <Button
                        key={item.href}
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start text-slate-200 hover:text-white hover:bg-slate-800",
                          isActive && "bg-blue-900/30 text-blue-100 hover:bg-blue-900/50"
                        )}
                        asChild
                      >
                        <Link href={item.href} onClick={isMobile ? onClose : undefined}>
                          <Icon className="h-4 w-4 mr-3" />
                          <span>{item.title}</span>
                        </Link>
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* Footer Section - User Profile */}
        {session && (
          <div className="p-3 border-t border-slate-700 flex-shrink-0">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Sign out</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-slate-800/50">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                      {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || "U"}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">
                      {session.user?.name || "User"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {session.user?.email}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign out</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}