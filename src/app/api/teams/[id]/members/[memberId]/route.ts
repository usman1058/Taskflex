// app/api/teams/[id]/members/[membershipId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; membershipId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id, membershipId } = await params
    
    const body = await request.json()
    const { role, status } = body
    
    if (!role || !status) {
      return NextResponse.json(
        { error: "Role and status are required" },
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
    
    const userMembership = team.members[0]
    const canEdit = team.ownerId === session.user.id || 
                     (userMembership && (userMembership.role === "OWNER" || userMembership.role === "ADMIN"))
    
    if (!canEdit) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    const membership = await db.teamMembership.findUnique({
      where: { id: membershipId }
    })
    
    if (!membership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 })
    }
    
    const updatedMembership = await db.teamMembership.update({
      where: { id: membershipId },
      data: {
        role,
        status
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })
    
    return NextResponse.json(updatedMembership)
  } catch (error) {
    console.error("Error updating team membership:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; membershipId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id, membershipId } = await params
    
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
    
    const userMembership = team.members[0]
    const canRemove = team.ownerId === session.user.id || 
                      (userMembership && (userMembership.role === "OWNER" || userMembership.role === "ADMIN"))
    
    if (!canRemove) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    const membership = await db.teamMembership.findUnique({
      where: { id: membershipId }
    })
    
    if (!membership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 })
    }
    
    if (membership.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot remove team owner" },
        { status: 400 }
      )
    }
    
    await db.teamMembership.delete({
      where: { id: membershipId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing team membership:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}