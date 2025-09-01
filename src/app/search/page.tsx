// app/search/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Clock, 
  FolderOpen, 
  Users, 
  Calendar,
  Flag,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { useDebounce } from "@/hooks/use-debounce"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  assignee?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  creator: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  project: {
    id: string
    name: string
    key: string
  }
}

interface Project {
  id: string
  name: string
  key: string
  description: string | null
  status: string
  _count: {
    tasks: number
    members: number
  }
}

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  status: string
  _count: {
    tasks: number
    assignedTasks: number
  }
}

interface SearchResult {
  tasks: Task[]
  projects: Project[]
  users: User[]
}

export default function SearchPage() {
  const { data: session } = useSession()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult>({ tasks: [], projects: [], users: [] })
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const debouncedQuery = useDebounce(query, 500)

  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem("recentSearches")
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches))
      } catch (error) {
        console.error("Error parsing recent searches:", error)
      }
    }
  }, [])

  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery)
    } else {
      setResults({ tasks: [], projects: [], users: [] })
    }
  }, [debouncedQuery])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      
      if (!response.ok) {
        throw new Error(`Failed to search: ${response.status}`)
      }
      
      const searchResults = await response.json()
      setResults(searchResults)
      
      // Update recent searches
      if (!recentSearches.includes(searchQuery)) {
        const updatedSearches = [searchQuery, ...recentSearches].slice(0, 5)
        setRecentSearches(updatedSearches)
        localStorage.setItem("recentSearches", JSON.stringify(updatedSearches))
      }
    } catch (error) {
      console.error("Error searching:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(query)
  }

  const handleRecentSearchClick = (searchTerm: string) => {
    setQuery(searchTerm)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("recentSearches")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-gray-100 text-gray-800"
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800"
      case "REVIEW": return "bg-yellow-100 text-yellow-800"
      case "DONE": return "bg-green-100 text-green-800"
      case "CLOSED": return "bg-gray-100 text-gray-800"
      case "CANCELLED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW": return "bg-green-100 text-green-800"
      case "MEDIUM": return "bg-yellow-100 text-yellow-800"
      case "HIGH": return "bg-orange-100 text-orange-800"
      case "URGENT": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-100 text-red-800"
      case "MANAGER": return "bg-purple-100 text-purple-800"
      case "AGENT": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN": return <Clock className="h-4 w-4 text-gray-500" />
      case "IN_PROGRESS": return <Clock className="h-4 w-4 text-blue-500" />
      case "REVIEW": return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "DONE": return <CheckCircle className="h-4 w-4 text-green-500" />
      case "CLOSED": return <CheckCircle className="h-4 w-4 text-gray-500" />
      case "CANCELLED": return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString()
  }

  const totalResults = results.tasks.length + results.projects.length + results.users.length

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search</h1>
          <p className="text-muted-foreground">
            Search across all your tasks, projects, and team members
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Global Search</CardTitle>
            <CardDescription>
              Search for tasks, projects, users, and more
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tasks, projects, people..."
                className="pl-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </form>
          </CardContent>
        </Card>
        
        {recentSearches.length > 0 && !query && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Searches</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearRecentSearches}>
                Clear
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((searchTerm, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleRecentSearchClick(searchTerm)}
                  >
                    {searchTerm}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        
        {query && !loading && (
          <>
            {totalResults > 0 ? (
              <div className="text-sm text-muted-foreground mb-4">
                Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No results found for "{query}"</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
        
        {results.tasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Tasks ({results.tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.tasks.map((task) => (
                  <div key={task.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getStatusIcon(task.status)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{task.title}</h3>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(task.priority)}>
                            <Flag className="mr-1 h-3 w-3" />
                            {task.priority}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FolderOpen className="h-4 w-4" />
                            <span>{task.project.name} ({task.project.key})</span>
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Due {formatDate(task.dueDate)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>
                              {task.assignee ? task.assignee.name : "Unassigned"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/tasks/${task.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {results.projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Projects ({results.projects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {results.projects.map((project) => (
                  <div key={project.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.key}</p>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FolderOpen className="h-4 w-4" />
                            <span>{project._count.tasks} tasks</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{project._count.members} members</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/projects/${project.id}`}>
                          View Project
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {results.users.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                People ({results.users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {results.users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          <span>{user._count.tasks} created</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          <span>{user._count.assignedTasks} assigned</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/users/${user.id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}