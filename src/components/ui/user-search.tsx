// app/components/ui/user-search.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

interface User {
  id: string
  name?: string
  email: string
  avatar?: string
}

interface UserSearchProps {
  users: User[]
  selectedUser: User | null
  onUserSelect: (user: User) => void
  onClearUser: () => void
  placeholder?: string
  disabled?: boolean
}

export function UserSearch({ 
  users, 
  selectedUser, 
  onUserSelect, 
  onClearUser, 
  placeholder = "Select assignee",
  disabled = false 
}: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = users.filter(user => 
        (user.name && user.name.toLowerCase().includes(term)) || 
        user.email.toLowerCase().includes(term)
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleUserSelect = (user: User) => {
    onUserSelect(user)
    setShowDropdown(false)
    setSearchTerm("")
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className={`flex items-center border rounded-md p-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setShowDropdown(!showDropdown)}
      >
        {selectedUser ? (
          <div className="flex items-center gap-2 w-full">
            <Avatar className="h-6 w-6">
              <AvatarImage src={selectedUser.avatar} />
              <AvatarFallback>{selectedUser.name?.charAt(0) || selectedUser.email.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{selectedUser.name}</p>
              <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClearUser();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{placeholder}</span>
          </div>
        )}
      </div>
      
      {showDropdown && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-md">
          <div className="p-2 border-b">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div 
                  key={user.id}
                  className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer"
                  onClick={() => handleUserSelect(user)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-2 text-sm text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}