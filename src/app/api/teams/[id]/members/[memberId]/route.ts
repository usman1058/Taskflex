// app/api/teams/[id]/members/[memberId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if the current user has permission to remove members
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
    
    // Only owners and admins can remove members
    if (
      team.ownerId !== session.user.id && 
      (!currentUserMembership || currentUserMembership.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    // Get the membership to be removed with user details
    const membershipToRemove = await db.teamMembership.findUnique({
      where: { id: params.memberId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })
    
    if (!membershipToRemove) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 })
    }
    
    // Owners cannot be removed
    if (membershipToRemove.role === "OWNER") {
      return NextResponse.json({ error: "Cannot remove team owner" }, { status: 400 })
    }
    
    // Create a notification for the user being removed
    await db.notification.create({
      data: {
        title: "Removed from Team",
        message: `You have been removed from the team "${team.name}"`,
        type: "TEAM_INVITATION", // Using the same type as invitations for consistency
        userId: membershipToRemove.userId
      }
    })
    
    // Remove the membership
    await db.teamMembership.delete({
      where: { id: params.memberId }
    })
    
    return NextResponse.json({ message: "Member removed successfully" })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}