"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  Clock
} from "lucide-react"
import { useSession } from "next-auth/react"

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
    icon: FolderOpen,
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

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className={cn("pb-12 w-64", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center mb-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <CheckSquare className="h-6 w-6" />
              <span className="font-bold text-lg">TaskFlow</span>
            </Link>
          </div>
          <div className="space-y-1">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={item.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
      
      {session && (
        <div className="absolute bottom-0 w-64 p-4 border-t">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session.user?.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session.user?.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}