// app/api/teams/[id]/meetings/route.ts (updated POST method)

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { google } from "googleapis"
import { sendMeetingEmail } from "@/lib/email"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { title, description, startTime, endTime } = body
    
    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Title, start time, and end time are required" },
        { status: 400 }
      )
    }
    
    // Check if user has permission to create meetings for this team
    const team = await db.team.findUnique({
      where: { id: params.id },
      include: {
        members: {
          where: { userId: session.user.id }
        }
      }
    })
    
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }
    
    const currentUserMembership = team.members[0]
    
    // Only owners and admins can create meetings
    if (
      team.ownerId !== session.user.id && 
      (!currentUserMembership || currentUserMembership.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    // Create Google Meet event
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    })
    
    const calendar = google.calendar({ version: "v3", auth })
    
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
          requestId: `${params.id}-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet"
          }
        }
      },
      attendees: team.members.map(member => ({ email: member.user.email }))
    }
    
    const calendarEvent = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    })
    
    const meetLink = calendarEvent.data.hangoutLink
    
    // Save meeting to database
    const meeting = await db.teamMeeting.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        meetLink,
        teamId: params.id,
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
      await db.notification.create({
        data: {
          title: "Team Meeting Scheduled",
          message: `A meeting "${title}" has been scheduled for ${new Date(startTime).toLocaleString()}`,
          type: "SYSTEM",
          userId: member.userId
        }
      })
      
      // Send email notification
      await sendMeetingEmail({
        to: member.user.email,
        teamName: team.name,
        meetingTitle: title,
        startTime: new Date(startTime),
        meetLink
      })
    }
    
    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error("Error scheduling meeting:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}