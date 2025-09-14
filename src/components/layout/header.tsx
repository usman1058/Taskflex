// components/layout/header.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationBell } from "./notification-bell"
import { LogOut, User, Settings, Menu, Search, HelpCircle, Plus, ChevronDown, ArrowLeft, CheckSquare, FolderOpen, Users } from "lucide-react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { OrganizationSwitcher } from "./organization-switcher"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  onMobileMenuToggle: () => void
  currentOrganization?: any
  isOrganizationPage?: boolean
}

export function Header({ onMobileMenuToggle, currentOrganization, isOrganizationPage }: HeaderProps) {
  const { data: session, update: updateSession } = useSession()
  const [searchOpen, setSearchOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const [timestamp, setTimestamp] = useState<number>(Date.now()) // Force re-render when avatar changes

  // Update avatar URL when session changes
  useEffect(() => {
    if (session?.user?.image) {
      setAvatarUrl(session.user.image)
    } else if (session?.user?.avatar) {
      setAvatarUrl(session.user.avatar)
    }
    
    // Set up a listener for avatar changes
    const handleAvatarUpdate = (event: CustomEvent) => {
      if (event.detail?.avatarUrl) {
        setAvatarUrl(event.detail.avatarUrl)
        setTimestamp(Date.now()) // Force re-render
      }
    }
    
    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener)
    
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener)
    }
  }, [session])

  // Function to force update the session
  const refreshSession = async () => {
    await updateSession()
    setTimestamp(Date.now()) // Force re-render
  }

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          {isOrganizationPage && currentOrganization && (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/organizations">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <span className="text-sm font-medium hidden sm:block">
                {currentOrganization.name}
              </span>
            </div>
          )}
          <Link href="/" className="font-bold text-xl hidden md:block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TaskFlow Pro
          </Link>
          <Link href="/" className="font-bold text-xl md:hidden bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TF
          </Link>
          {/* Organization Switcher */}
          {session && !isOrganizationPage && (
            <OrganizationSwitcher />
          )}
        </div>
        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search tasks, projects, or people..."
              className="pl-10 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Mobile Search */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="h-5 w-5" />
          </Button>
          {/* Theme Toggle */}
          <ThemeToggle />
          {/* Create New Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" className="hidden sm:flex">
                <Plus className="h-4 w-4 mr-1" />
                Create
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="end">
              <div className="grid grid-cols-1 gap-1 p-2">
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/tasks/create">
                    <CheckSquare className="h-4 w-4 mr-2" />
                    New Task
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/projects/create">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    New Project
                  </Link>
                </Button>
                {isOrganizationPage && (
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link href={`/organizations/${currentOrganization?.id}/teams/create`}>
                      <Users className="h-4 w-4 mr-2" />
                      New Team
                    </Link>
                  </Button>
                )}
                {!isOrganizationPage && (
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/teams/create">
                      <Users className="h-4 w-4 mr-2" />
                      New Team
                    </Link>
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          {/* Notifications */}
          <NotificationBell />
          {/* Help */}
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <HelpCircle className="h-5 w-5" />
          </Button>
          {/* User Menu */}
          {session && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={`${avatarUrl}?t=${timestamp}`} // Add timestamp to prevent caching
                      alt={session.user.name || ""}
                      key={`${avatarUrl}-${timestamp}`} // Force re-render when avatar changes
                      onError={(e) => {
                        // If image fails to load, hide it and show the fallback
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {session.user.name && (
                      <p className="font-medium">{session.user.name}</p>
                    )}
                    {session.user.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {session.user.email}
                      </p>
                    )}
                    <Badge variant="outline" className="w-fit mt-1">
                      {session.user.role || "User"}
                    </Badge>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" onClick={refreshSession}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      {/* Mobile Search Bar */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search tasks, projects, or people..."
              className="pl-10 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  )
}