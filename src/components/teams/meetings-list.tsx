// components/teams/meetings-list.tsx
"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Video, ExternalLink, MoreHorizontal, Share2, MessageCircle, Mail } from "lucide-react"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface TeamMeeting {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  meetLink: string | null
  createdAt: string
  creator: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

interface MeetingsListProps {
  teamId: string
  canCreateMeetings: boolean
}

export function MeetingsList({ teamId, canCreateMeetings }: MeetingsListProps) {
  const [meetings, setMeetings] = useState<TeamMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchMeetings()
  }, [teamId])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teams/${teamId}/meetings`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch meetings: ${response.status}`)
      }
      
      const meetingsData = await response.json()
      setMeetings(meetingsData)
    } catch (error) {
      console.error("Error fetching meetings:", error)
      setError("Failed to load meetings. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const isUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date()
  }

  const shareViaWhatsApp = (meeting: TeamMeeting) => {
    const meetingDetails = `Meeting: ${meeting.title}\nDate: ${format(new Date(meeting.startTime), "PPP")}\nTime: ${format(new Date(meeting.startTime), "HH:mm")} - ${format(new Date(meeting.endTime), "HH:mm")}\n\n${meeting.meetLink ? `Join: ${meeting.meetLink}` : ""}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(meetingDetails)}`
    window.open(whatsappUrl, '_blank')
  }

  const shareViaEmail = (meeting: TeamMeeting) => {
    const subject = encodeURIComponent(`Meeting: ${meeting.title}`)
    const body = encodeURIComponent(`Meeting: ${meeting.title}\nDate: ${format(new Date(meeting.startTime), "PPP")}\nTime: ${format(new Date(meeting.startTime), "HH:mm")} - ${format(new Date(meeting.endTime), "HH:mm")}\n\n${meeting.meetLink ? `Join: ${meeting.meetLink}` : ""}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const copyMeetingLink = (meeting: TeamMeeting) => {
    if (meeting.meetLink) {
      navigator.clipboard.writeText(meeting.meetLink)
      toast({
        title: "Link copied",
        description: "Meeting link has been copied to clipboard",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Team Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Team Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchMeetings} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (meetings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Team Meetings
          </CardTitle>
          <CardDescription>
            No meetings scheduled yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Schedule your first team meeting to get started
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Team Meetings
        </CardTitle>
        <CardDescription>
          Upcoming and past team meetings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="flex items-start justify-between p-4 border rounded-lg"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <Video className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-medium">{meeting.title}</h3>
                  {meeting.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {meeting.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(meeting.startTime), "PPP p")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>
                        {format(new Date(meeting.startTime), "HH:mm")}
                      </span>
                      <span>-</span>
                      <span>
                        {format(new Date(meeting.endTime), "HH:mm")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={meeting.creator.avatar} />
                      <AvatarFallback>
                        {meeting.creator.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">
                      {meeting.creator.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isUpcoming(meeting.startTime) && (
                  <Badge variant="outline">Upcoming</Badge>
                )}
                {meeting.meetLink && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={meeting.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Join
                    </a>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/teams/${teamId}/meetings/${meeting.id}`}>
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => shareViaWhatsApp(meeting)}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Share via WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => shareViaEmail(meeting)}>
                      <Mail className="h-4 w-4 mr-2" />
                      Share via Email
                    </DropdownMenuItem>
                    {meeting.meetLink && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => copyMeetingLink(meeting)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Copy Meeting Link
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}