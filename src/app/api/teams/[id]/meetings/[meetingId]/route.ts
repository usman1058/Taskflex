import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id, meetingId } = await params
    
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
    
    // Try to fetch meeting, but handle the case where the table doesn't exist
    try {
      const meeting = await db.teamMeeting.findUnique({
        where: { 
          id: meetingId,
          teamId: id
        },
        include: {
          team: {
            select: { name: true }
          },
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      })
      
      console.log("Fetched meeting detail:", meeting)
      
      if (!meeting) {
        return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
      }
      
      return NextResponse.json(meeting)
    } catch (dbError) {
      console.error("Error fetching meeting:", dbError)
      if (dbError.code === 'P2021') {
        return NextResponse.json({ error: "Meetings table not found" }, { status: 404 })
      }
      return NextResponse.json(
        { error: "Failed to fetch meeting" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error fetching meeting:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id, meetingId } = await params
    
    // Fetch the meeting to check permissions
    const meeting = await db.teamMeeting.findUnique({
      where: { 
        id: meetingId,
        teamId: id
      },
      include: {
        team: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })
    
    console.log("Meeting for cancellation:", meeting)
    
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }
    
    // Check if user can cancel the meeting (creator or admin)
    const canCancel = meeting.creatorId === session.user.id || 
                      session.user.role === "ADMIN" ||
                      meeting.team.members.some(m => m.userId === session.user.id && m.role === "ADMIN")
    
    console.log("Can cancel meeting:", canCancel)
    
    if (!canCancel) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    // Delete the meeting
    await db.teamMeeting.delete({
      where: { id: meetingId }
    })
    
    // Create notifications for all team members about the cancellation
    const teamMembers = await db.teamMembership.findMany({
      where: { teamId: id },
      include: {
        user: true
      }
    })
    
    for (const member of teamMembers) {
      await db.notification.create({
        data: {
          title: "Meeting Cancelled",
          message: `The meeting "${meeting.title}" scheduled for ${new Date(meeting.startTime).toLocaleString()} has been cancelled`,
          type: "SYSTEM",
          userId: member.userId
        }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error cancelling meeting:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}