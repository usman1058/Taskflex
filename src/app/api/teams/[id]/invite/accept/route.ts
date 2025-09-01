// app/api/teams/[id]/invite/accept/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { token } = body
    
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }
    
    const { id } = await params
    
    const membership = await db.teamMembership.findFirst({
      where: {
        token,
        teamId: id,
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
    
    await db.teamMembership.update({
      where: { id: membership.id },
      data: {
        status: "ACTIVE",
        joinedAt: new Date(),
        token: null
      }
    })
    
    const teamMemberships = await db.teamMembership.findMany({
      where: {
        teamId: id,
        role: {
          in: ["OWNER", "ADMIN"]
        },
        userId: {
          not: membership.userId
        }
      },
      select: { userId: true }
    })
    
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