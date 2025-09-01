// app/api/teams/[id]/meetings/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { google } from "googleapis"
import { sendMeetingEmail } from "@/lib/email"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id } = await params
    
    const body = await request.json()
    const { title, description, startTime, endTime } = body
    
    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Title, start time, and end time are required" },
        { status: 400 }
      )
    }
    
    const team = await db.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true // Include user data to access email
          }
        },
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    })
    
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }
    
    const currentUserMembership = team.members.find(m => m.userId === session.user.id)
    
    if (
      team.ownerId !== session.user.id && 
      (!currentUserMembership || currentUserMembership.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    let meetLink = null;
    
    // Try to create Google Meet event, but continue even if it fails
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      })
      
      const calendar = google.calendar({ version: "v3", auth })
      
      // Get all member emails, including the owner
      const attendeeEmails = team.members
        .filter(member => member.user && member.user.email)
        .map(member => ({ email: member.user.email }))
      
      // Add owner if not already included
      if (team.owner.email && !attendeeEmails.some(a => a.email === team.owner.email)) {
        attendeeEmails.push({ email: team.owner.email })
      }
      
      const event = {
        summary: `${team.name}: ${title}`,
        description: description || `Team meeting for ${team.name}`,
        start: {
          dateTime: new Date(startTime).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: new Date(endTime).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        conferenceData: {
          createRequest: {
            requestId: `${id}-${Date.now()}`,
            conferenceSolutionKey: {
              type: "hangoutsMeet"
            }
          }
        },
        attendees: attendeeEmails
      }
      
      const calendarEvent = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
      })
      
      meetLink = calendarEvent.data.hangoutLink
    } catch (googleError) {
      console.error("Error creating Google Meet event:", googleError)
      // Continue without Google Meet link
    }
    
    // Try to create meeting in database
    try {
      const meeting = await db.teamMeeting.create({
        data: {
          title,
          description,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          meetLink,
          teamId: id,
          createdBy: session.user.id
        },
        include: {
          team: {
            select: { name: true }
          },
          creator: {
            select: { name: true, email: true }
          }
        }
      })
      
      // Create notifications for all team members
      for (const member of team.members) {
        try {
          if (member.user) {
            await db.notification.create({
              data: {
                title: "Team Meeting Scheduled",
                message: `A meeting "${title}" has been scheduled for ${new Date(startTime).toLocaleString()}`,
                type: "SYSTEM",
                userId: member.userId
              }
            })
            
            // Send email notification
            if (meetLink && member.user.email) {
              await sendMeetingEmail({
                to: member.user.email,
                teamName: team.name,
                meetingTitle: title,
                startTime: new Date(startTime),
                meetLink
              })
            }
          }
        } catch (notificationError) {
          console.error("Error creating notification:", notificationError)
          // Continue even if notification fails
        }
      }
      
      return NextResponse.json(meeting, { status: 201 })
    } catch (dbError) {
      console.error("Error creating meeting in database:", dbError)
      return NextResponse.json(
        { error: "Failed to create meeting. The team_meetings table might not exist in the database." },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error scheduling meeting:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id } = await params
    
    // Check if user is a member of the team
    const team = await db.team.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: session.user.id }
        }
      }
    })
    
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }
    
    const isMember = team.members.length > 0 || session.user.role === "ADMIN"
    
    if (!isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    // Try to fetch meetings, but handle the case where the table doesn't exist
    try {
      const meetings = await db.teamMeeting.findMany({
        where: { teamId: id },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { startTime: "desc" }
      })
      
      return NextResponse.json(meetings)
    } catch (dbError) {
      console.error("Error fetching meetings:", dbError)
      // Return empty array if table doesn't exist
      if (dbError.code === 'P2021') {
        return NextResponse.json([])
      }
      return NextResponse.json(
        { error: "Failed to fetch meetings" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error fetching meetings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}