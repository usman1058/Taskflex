import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Unwrap params Promise
    const { id } = await params
    
    const body = await request.json()
    const { email, role = "MEMBER" } = body
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }
    
    // Check if organization exists and user has permission
    const organization = await db.organization.findUnique({
      where: { id },
      include: {
        members: {
          where: {
            userId: session.user.id
          }
        }
      }
    })
    
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }
    
    // Check if user has permission to invite members
    const currentUserMember = organization.members[0]
    const hasPermission = session.user.role === "ADMIN" || 
                         (currentUserMember && 
                          (currentUserMember.role === "OWNER" || currentUserMember.role === "ADMIN"))
    
    if (!hasPermission) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }
    
    // Find user by email
    const user = await db.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: "User with this email not found" },
        { status: 404 }
      )
    }
    
    // Check if user is already a member
    const existingMember = await db.organizationMember.findUnique({
      where: {
        userId: user.id,
        organizationId: id
      }
    })
    
    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 400 }
      )
    }
    
    // Add user to organization
    const newMember = await db.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: id,
        role
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })
    
    // Create notification for new member
    await db.notification.create({
      data: {
        title: "Added to Organization",
        message: `You have been added to the organization "${organization.name}"`,
        type: "SYSTEM",
        userId: user.id
      }
    })
    
    return NextResponse.json(newMember, { status: 201 })
  } catch (error) {
    console.error("Error inviting organization member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}