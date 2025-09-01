// app/api/teams/[id]/invite/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendInvitationEmail } from "@/lib/email" // Import the email function
import crypto from 'crypto' // For generating tokens

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
    const { email, role } = body
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }
    
    // Check if the user exists
    const user = await db.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    // Check if the user is already a member of the team
    const existingMembership = await db.teamMembership.findFirst({
      where: {
        userId: user.id,
        teamId: params.id
      }
    })
    
    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of this team" },
        { status: 400 }
      )
    }
    
    // Check if the current user has permission to invite
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
    
    // Only owners and admins can invite
    if (
      team.ownerId !== session.user.id && 
      (!currentUserMembership || currentUserMembership.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    // Generate a secure token for the invitation
    const token = crypto.randomBytes(32).toString('hex')
    
    // Create the membership
    const membership = await db.teamMembership.create({
      data: {
        userId: user.id,
        teamId: params.id,
        role: role || "MEMBER",
        status: "PENDING",
        invitedAt: new Date(),
        invitedBy: session.user.id, // Store the inviter's ID
        token // Store the token
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })
    
    // Create a notification for the invited user
    await db.notification.create({
      data: {
        title: "Team Invitation",
        message: `You have been invited to join the team "${team.name}"`,
        type: "TEAM_INVITATION",
        userId: user.id
      }
    })
    
    // Send invitation email
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/teams/${params.id}/invite?token=${token}`
    const emailResult = await sendInvitationEmail({
      to: user.email,
      teamName: team.name,
      inviterName: session.user.name || session.user.email,
      inviteLink,
    })
    
    if (!emailResult.success) {
      console.error("Failed to send invitation email:", emailResult.error)
      // Optionally, you might want to delete the membership if email fails
      // Or mark it as email_failed
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