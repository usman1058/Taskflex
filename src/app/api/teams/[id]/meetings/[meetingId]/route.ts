// app/api/teams/[id]/meetings/[meetingId]/route.ts
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
    
    // Unwrap params Promise
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
    
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }
    
    return NextResponse.json(meeting)
  } catch (error) {
    console.error("Error fetching meeting:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}