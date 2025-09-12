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
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const teamId = id
    const body = await request.json()

    // Check if user is a member of the team and has permission to create meetings
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: {
            userId: session.user.id
          }
        }
      }
    })

    if (!team || (team.members.length === 0 && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Team not found or access denied" }, { status: 404 })
    }

    // Check if user has permission to create meetings (OWNER or ADMIN)
    const member = team.members[0]
    if (member && member.role !== "OWNER" && member.role !== "ADMIN" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Generate Google Meet link
    // This requires Google Calendar API integration
    // We assume you have set up OAuth2 for Google Calendar API

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    // Set credentials (you need to handle token refresh, this is simplified)
    oauth2Client.setCredentials({
      access_token: session.user.accessToken, // Assuming you store the access token in the session
      refresh_token: session.user.refreshToken, // Assuming you store the refresh token
    })

    const calendar = google.calendar({ version: "v3", auth: oauth2Client })

    const event = {
      summary: body.title,
      description: body.description,
      start: {
        dateTime: body.startTime,
        timeZone: "UTC", // Adjust as needed
      },
      end: {
        dateTime: body.endTime,
        timeZone: "UTC", // Adjust as needed
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet"
          }
        }
      }
    }

    const calendarEvent = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1
    })

    const meetLink = calendarEvent.data.hangoutLink

    // Create the meeting in the database
    const meeting = await db.teamMeeting.create({
      data: {
        title: body.title,
        description: body.description,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        meetLink,
        teamId,
        creatorId: session.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error("Error creating meeting:", error)
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
      
      console.log("Fetched meetings:", meetings)
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