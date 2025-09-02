"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Video, Calendar, Clock, User, ExternalLink, ArrowLeft, X } from "lucide-react"
import { format } from "date-fns"
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
  team: {
    name: string
  }
  creator: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export default function MeetingDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string
  const meetingId = params.meetingId as string
  
  const [meeting, setMeeting] = useState<TeamMeeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (teamId && meetingId) {
      fetchMeeting()
    }
  }, [teamId, meetingId])

  const fetchMeeting = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/teams/${teamId}/meetings/${meetingId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Meeting not found")
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to fetch meeting: ${response.status}`)
        }
        return
      }
      
      const meetingData = await response.json()
      console.log("Meeting detail data received:", meetingData)
      setMeeting(meetingData)
    } catch (error) {
      console.error("Error fetching meeting:", error)
      setError(error instanceof Error ? error.message : "Failed to load meeting. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelMeeting = async () => {
    if (!meeting) return
    
    setIsCancelling(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/meetings/${meeting.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to cancel meeting")
      }

      toast({
        title: "Meeting cancelled",
        description: "The meeting has been cancelled successfully.",
      })

      router.push(`/teams/${teamId}`)
    } catch (error) {
      console.error("Error cancelling meeting:", error)
      toast({
        title: "Error",
        description: "Failed to cancel meeting",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const canCancelMeeting = () => {
    console.log("Checking cancel permissions for meeting detail page")
    console.log("Session user:", session?.user)
    console.log("Meeting creator:", meeting?.creator)
    
    if (!session || !session.user || !meeting) {
      console.log("Missing session, user, or meeting data")
      return false
    }
    
    const isCreator = meeting.creator.id === session.user.id
    const isAdmin = session.user.role === "ADMIN"
    
    console.log("Is creator:", isCreator)
    console.log("Is admin:", isAdmin)
    
    return isCreator || isAdmin
  }

  const isUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date()
  }

  const copyMeetingLink = () => {
    if (meeting && meeting.meetLink) {
      navigator.clipboard.writeText(meeting.meetLink)
      toast({
        title: "Link copied",
        description: "Meeting link has been copied to clipboard",
      })
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    )
  }

  if (error || !meeting) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <span className="text-red-600 text-xl">!</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error || "Meeting not found"}</p>
            <Button asChild>
              <Link href={`/teams/${teamId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Team
              </Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  console.log("Rendering meeting detail page with meeting:", meeting)
  console.log("Can cancel meeting:", canCancelMeeting())
  console.log("Is upcoming:", isUpcoming(meeting.startTime))

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/teams/${teamId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Meeting Details</h1>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  {meeting.title}
                </CardTitle>
                <CardDescription>
                  {meeting.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Start Time</h3>
                    <p className="text-muted-foreground">
                      {format(new Date(meeting.startTime), "PPP p")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {format(new Date(meeting.startTime), "HH:mm")}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">End Time</h3>
                    <p className="text-muted-foreground">
                      {format(new Date(meeting.endTime), "PPP p")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {format(new Date(meeting.endTime), "HH:mm")}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Team</h3>
                  <p className="text-muted-foreground">{meeting.team.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Created By</h3>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={meeting.creator.avatar} />
                      <AvatarFallback>
                        {meeting.creator.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{meeting.creator.name}</p>
                      <p className="text-sm text-muted-foreground">{meeting.creator.email}</p>
                    </div>
                  </div>
                </div>
                
                {isUpcoming(meeting.startTime) && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Upcoming</Badge>
                    <p className="text-sm text-muted-foreground">
                      Starts in {Math.floor((new Date(meeting.startTime).getTime() - new Date().getTime()) / (1000 * 60))} minutes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Google Meet Link Card */}
            {meeting.meetLink && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Google Meet Link
                  </CardTitle>
                  <CardDescription>
                    Join the meeting using this link
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-md">
                    <a 
                      href={meeting.meetLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {meeting.meetLink}
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" asChild>
                      <a
                        href={meeting.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Join Meeting
                      </a>
                    </Button>
                    <Button variant="outline" onClick={copyMeetingLink}>
                      Copy Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Meeting Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {meeting.meetLink && (
                  <Button className="w-full" asChild>
                    <a
                      href={meeting.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Join Google Meet
                    </a>
                  </Button>
                )}
                {canCancelMeeting() && isUpcoming(meeting.startTime) && (
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={handleCancelMeeting}
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Cancel Meeting
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/teams/${teamId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Team
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Meeting Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Duration</span>
                  </div>
                  <span className="font-medium">
                    {Math.floor((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / (1000 * 60))} minutes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Created</span>
                  </div>
                  <span className="font-medium">
                    {format(new Date(meeting.createdAt), "PPP p")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}