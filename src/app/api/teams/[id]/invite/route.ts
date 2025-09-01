// app/api/teams/[id]/invite/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendInvitationEmail } from "@/lib/email"
import crypto from 'crypto'

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
    const { email, role } = body
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }
    
    const user = await db.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    const existingMembership = await db.teamMembership.findFirst({
      where: {
        userId: user.id,
        teamId: id
      }
    })
    
    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of this team" },
        { status: 400 }
      )
    }
    
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
    
    const currentUserMembership = team.members[0]
    
    if (
      team.ownerId !== session.user.id && 
      (!currentUserMembership || currentUserMembership.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    const token = crypto.randomBytes(32).toString('hex')
    
    const membership = await db.teamMembership.create({
      data: {
        userId: user.id,
        teamId: id,
        role: role || "MEMBER",
        status: "PENDING",
        invitedAt: new Date(),
        invitedBy: session.user.id,
        token
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })
    
    await db.notification.create({
      data: {
        title: "Team Invitation",
        message: `You have been invited to join the team "${team.name}"`,
        type: "TEAM_INVITATION",
        userId: user.id
      }
    })
    
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/teams/${id}/invite?token=${token}`
    const emailResult = await sendInvitationEmail({
      to: user.email,
      teamName: team.name,
      inviterName: session.user.name || session.user.email,
      inviteLink,
    })
    
    if (!emailResult.success) {
      console.error("Failed to send invitation email:", emailResult.error)
    }
    
    return NextResponse.json(membership, { status: 201 })
  } catch (error) {
    console.error("Error inviting user to team:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}