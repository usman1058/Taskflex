// components/user/user-teams.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, ExternalLink } from "lucide-react"
import Link from "next/link"

interface Team {
  id: string
  name: string
  description?: string
  avatar?: string
  status: string
  createdAt: string
  updatedAt: string
  organizationId?: string
  ownerId: string
  _count: {
    members: number;
    tasks: number;
  };
}

interface UserTeamsProps {
  userId: string
}

export function UserTeams({ userId }: UserTeamsProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserTeams()
  }, [userId])

  const fetchUserTeams = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}/teams`)
      
      if (response.ok) {
        const teamsData = await response.json()
        setTeams(teamsData || [])
      }
    } catch (error) {
      console.error("Error fetching user teams:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
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
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Teams
        </CardTitle>
        <CardDescription>
          Teams this user is a member of
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teams.length > 0 ? (
            teams.map((team) => (
              <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={team.avatar} />
                    <AvatarFallback>
                      {team.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {team._count.members} members, {team._count.tasks} tasks
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={team.status === "ACTIVE" ? "default" : "secondary"}>
                    {team.status}
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/teams/${team.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Not a member of any teams</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}