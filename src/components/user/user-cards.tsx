// components/user/user-card.tsx
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Mail, Phone, MapPin, Calendar, MoreHorizontal, ExternalLink } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  status: string
  bio?: string
  location?: string
  createdAt: string
}

interface UserCardProps {
  user: User
  showActions?: boolean
  onRemove?: (userId: string) => void
  onChangeRole?: (userId: string, role: string) => void
}

export function UserCard({ user, showActions = false, onRemove, onChangeRole }: UserCardProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "MANAGER": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "AGENT": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "INACTIVE": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      case "SUSPENDED": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-lg">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{user.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getRoleColor(user.role)}>
                  {user.role}
                </Badge>
                <Badge className={getStatusColor(user.status)}>
                  {user.status}
                </Badge>
              </div>
            </div>
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/users/${user.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Profile
                  </Link>
                </DropdownMenuItem>
                {onChangeRole && (
                  <>
                    <DropdownMenuItem onClick={() => onChangeRole(user.id, "ADMIN")}>
                      Make Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onChangeRole(user.id, "MANAGER")}>
                      Make Manager
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onChangeRole(user.id, "MEMBER")}>
                      Make Member
                    </DropdownMenuItem>
                  </>
                )}
                {onRemove && (
                  <DropdownMenuItem 
                    onClick={() => onRemove(user.id)}
                    className="text-destructive"
                  >
                    Remove
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{user.email}</span>
          </div>
          
          {user.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{user.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Joined {formatDate(user.createdAt)}</span>
          </div>
          
          {user.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {user.bio}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}