import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { token } = body
    
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }
    
    // Find the membership by token
    const membership = await db.teamMembership.findFirst({
      where: {
        token,
        teamId: params.id,
        status: "PENDING"
      },
      include: {
        team: true,
        user: true
      }
    })
    
    if (!membership) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 })
    }
    
    // Update the membership to active
    await db.teamMembership.update({
      where: { id: membership.id },
      data: {
        status: "ACTIVE",
        joinedAt: new Date(),
        token: null // Clear the token after use
      }
    })
    
    // Notify team owner and admins about the new member
    const teamMemberships = await db.teamMembership.findMany({
      where: {
        teamId: params.id,
        role: {
          in: ["OWNER", "ADMIN"]
        },
        userId: {
          not: membership.userId // Don't notify the user who just accepted
        }
      },
      select: { userId: true }
    })
    
    // Create notifications for team owners and admins
    for (const member of teamMemberships) {
      await db.notification.create({
        data: {
          title: "New Team Member",
          message: `${membership.user.name || membership.user.email} has joined the team "${membership.team.name}"`,
          type: "TEAM_INVITATION",
          userId: member.userId
        }
      })
    }
    
    // Create a confirmation notification for the user who accepted
    await db.notification.create({
      data: {
        title: "Team Invitation Accepted",
        message: `You have successfully joined the team "${membership.team.name}"`,
        type: "TEAM_INVITATION",
        userId: membership.userId
      }
    })
    
    return NextResponse.json({ message: "Invitation accepted successfully" })
  } catch (error) {
    console.error("Error accepting invitation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}