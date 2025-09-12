// app/api/notifications/route.ts (Updated)
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTeamInvitationDetails } from "@/lib/team-invitations"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit
    
    const notifications = await db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })
    
    // Enhance notifications with team invitation details and links
    const enhancedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        const enhancedNotification: any = { ...notification }
        
        // Add appropriate link based on notification type
        let link: string | undefined
        
        switch (notification.type) {
          case "TASK_ASSIGNED":
          case "TASK_UPDATED":
          case "TASK_COMPLETED":
            // Try to extract task ID from the notification data or message
            if (notification.data && notification.data.taskId) {
              link = `/tasks/${notification.data.taskId}`
            } else {
              // Fallback: try to extract from message
              const taskIdMatch = notification.message.match(/task[:\s]+#?(\d+)/i) || 
                                 notification.message.match(/#(\d+)/)
              const taskId = taskIdMatch ? taskIdMatch[1] : null
              link = taskId ? `/tasks/${taskId}` : "/tasks"
            }
            break
            
          case "COMMENT_ADDED":
          case "MENTION":
            if (notification.data && notification.data.taskId) {
              link = `/tasks/${notification.data.taskId}#comments`
            } else {
              const taskIdMatch = notification.message.match(/task[:\s]+#?(\d+)/i) || 
                                 notification.message.match(/#(\d+)/)
              const taskId = taskIdMatch ? taskIdMatch[1] : null
              link = taskId ? `/tasks/${taskId}#comments` : "/tasks"
            }
            break
            
          case "TEAM_INVITATION":
            // For team invitations, we need to fetch additional details
            const invitationDetails = await getTeamInvitationDetails(notification.id, session.user.id)
            
            if (invitationDetails) {
              enhancedNotification.teamId = invitationDetails.teamId
              enhancedNotification.teamName = invitationDetails.teamName
              enhancedNotification.token = invitationDetails.token
              enhancedNotification.inviterName = invitationDetails.inviterName
              
              // Set link based on invitation status
              if (notification.title.includes("Accepted") || notification.message.includes("successfully joined")) {
                // If already accepted, link to the team page
                link = `/teams/${invitationDetails.teamId}`
              } else {
                // If pending, no direct link - handled by popup
                link = undefined
              }
            } else {
              // Fallback if no invitation details found
              link = undefined
            }
            break
            
          case "TEAM_MEETING_SCHEDULED":
            // For meeting notifications, try to extract meeting details
            if (notification.data && notification.data.meetingId) {
              link = `/meetings/${notification.data.meetingId}`
            } else if (notification.data && notification.data.eventId) {
              link = `/calendar?eventId=${notification.data.eventId}`
            } else {
              // Extract meeting name from message and try to find it
              const meetingNameMatch = notification.message.match(/meeting "([^"]+)"/)
              if (meetingNameMatch) {
                const meetingName = meetingNameMatch[1]
                // Try to find meeting by name
                try {
                  const meeting = await db.meeting.findFirst({
                    where: { title: meetingName }
                  })
                  if (meeting) {
                    link = `/meetings/${meeting.id}`
                  } else {
                    link = "/calendar"
                  }
                } catch (error) {
                  link = "/calendar"
                }
              } else {
                link = "/calendar"
              }
            }
            break
            
          case "NEW_TEAM_MEMBER":
            // For new team member notifications, link to the team page
            if (notification.data && notification.data.teamId) {
              link = `/teams/${notification.data.teamId}`
            } else {
              // Try to extract team name from message
              const teamNameMatch = notification.message.match(/team "([^"]+)"/)
              if (teamNameMatch) {
                const teamName = teamNameMatch[1]
                // Try to find team by name
                try {
                  const team = await db.team.findFirst({
                    where: { name: teamName }
                  })
                  if (team) {
                    link = `/teams/${team.id}`
                  } else {
                    link = "/teams"
                  }
                } catch (error) {
                  link = "/teams"
                }
              } else {
                link = "/teams"
              }
            }
            break
            
          default:
            // For any other notification types, default to notifications page
            link = "/notifications"
        }
        
        // Ensure every notification has a link, even if it's a fallback
        if (!link) {
          // Provide fallback links based on notification type
          switch (notification.type) {
            case "TASK_ASSIGNED":
            case "TASK_UPDATED":
            case "TASK_COMPLETED":
            case "COMMENT_ADDED":
            case "MENTION":
              link = "/tasks"
              break
            case "TEAM_INVITATION":
              link = "/teams"
              break
            case "TEAM_MEETING_SCHEDULED":
              link = "/calendar"
              break
            case "NEW_TEAM_MEMBER":
              link = "/teams"
              break
            default:
              link = "/notifications"
          }
        }
        
        enhancedNotification.link = link
        
        return enhancedNotification
      })
    )
    
    const totalCount = await db.notification.count({
      where: { userId: session.user.id }
    })
    
    return NextResponse.json(enhancedNotifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { notificationIds, read } = body
    
    await db.notification.updateMany({
      where: {
        id: {
          in: notificationIds
        },
        userId: session.user.id
      },
      data: {
        read
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}