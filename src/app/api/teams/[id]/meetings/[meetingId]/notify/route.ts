// app/api/teams/[id]/meetings/[meetingId]/notify/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, meetingId } = await params
    const teamId = id

    // Check if user is a member of the team
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    })

    if (!team || (team.members.length === 0 && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Team not found or access denied" }, { status: 404 })
    }

    // Get meeting details
    const meeting = await db.teamMeeting.findUnique({
      where: { id: meetingId }
    })

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    // Send notifications to all team members except the creator
    const notificationPromises = team.members
      .filter(member => member.userId !== session.user.id)
      .map(member => 
        db.notification.create({
          data: {
            title: "New Meeting Scheduled",
            message: `A new meeting "${meeting.title}" has been scheduled for ${new Date(meeting.startTime).toLocaleString()}`,
            type: "MEETING_INVITE",
            userId: member.userId,
            metadata: {
              meetingId: meeting.id,
              teamId
            }
          }
        })
      )

    await Promise.all(notificationPromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending meeting notifications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}