// components/user/user-stats.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, Target, Users, AlertCircle } from "lucide-react"

interface UserStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  projectsCount: number
  teamsCount: number
}

interface UserStatsProps {
  userId: string
}

export function UserStats({ userId }: UserStatsProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserStats()
  }, [userId])

  const fetchUserStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}/stats`)
      
      if (response.ok) {
        const statsData = await response.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error("Error fetching user stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const statsData = [
    {
      title: "Total Tasks",
      value: stats?.totalTasks?.toString() || "0",
      icon: Target,
      color: "text-blue-600",
    },
    {
      title: "Completed",
      value: stats?.completedTasks?.toString() || "0",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "In Progress",
      value: stats?.inProgressTasks?.toString() || "0",
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Overdue",
      value: stats?.overdueTasks?.toString() || "0",
      icon: AlertCircle,
      color: "text-red-600",
    },
    {
      title: "Projects",
      value: stats?.projectsCount?.toString() || "0",
      icon: Target,
      color: "text-purple-600",
    },
    {
      title: "Teams",
      value: stats?.teamsCount?.toString() || "0",
      icon: Users,
      color: "text-orange-600",
    },
  ]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
        <CardDescription>
          User performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statsData.map((stat) => (
            <div key={stat.title} className="text-center p-4 border rounded-lg">
              <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.title}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}