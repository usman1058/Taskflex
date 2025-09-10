// app/components/ui/multi-assignee-select.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, X, Plus } from "lucide-react"

interface User {
  id: string
  name?: string
  email: string
  avatar?: string
}

interface MultiAssigneeSelectProps {
  users: User[]
  selectedUsers: User[]
  onUsersChange: (users: User[]) => void
  placeholder?: string
  disabled?: boolean
}

export function MultiAssigneeSelect({ 
  users, 
  selectedUsers, 
  onUsersChange, 
  placeholder = "Select assignees",
  disabled = false 
}: MultiAssigneeSelectProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Filter users based on search term and exclude already selected users
    if (searchTerm.trim() === "") {
      setFilteredUsers(users.filter(user => 
        !selectedUsers.some(selected => selected.id === user.id)
      ))
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = users.filter(user => 
        (user.name && user.name.toLowerCase().includes(term)) || 
        user.email.toLowerCase().includes(term)
      ).filter(user => 
        !selectedUsers.some(selected => selected.id === user.id)
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users, selectedUsers])

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

  const handleAddUser = (user: User) => {
    onUsersChange([...selectedUsers, user])
    setSearchTerm("")
  }

  const handleRemoveUser = (user: User) => {
    onUsersChange(selectedUsers.filter(u => u.id !== user.id))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className={`flex items-center border rounded-md p-2 min-h-[42px] flex-wrap gap-1 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && setShowDropdown(!showDropdown)}
      >
        {selectedUsers.length > 0 ? (
          selectedUsers.map(user => (
            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
              <Avatar className="h-5 w-5">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
              </Avatar>
              {user.name || user.email}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveUser(user);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>{placeholder}</span>
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
                  onClick={() => handleAddUser(user)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
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