// app/api/organizations/[id]/members/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
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
    
    // Check if organization exists and user has access
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
    
    // Check if user has access to this organization
    const hasAccess = organization.members.length > 0 || session.user.role === "ADMIN"
    
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    // Get all members with their roles and user details
    const members = await db.organizationMember.findMany({
      where: { organizationId: id },
      include: {
        user: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            avatar: true,
            role: true,
            status: true,
            bio: true,
            location: true,
            createdAt: true
          }
        }
      },
      orderBy: { joinedAt: "desc" }
    })
    
    return NextResponse.json(members)
  } catch (error) {
    console.error("Error fetching organization members:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

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
    
    // Check if user has permission to add members
    const currentUserMember = organization.members[0]
    const hasPermission = session.user.role === "ADMIN" || 
                         (currentUserMember && 
                          (currentUserMember.role === "OWNER" || currentUserMember.role === "ADMIN"))
    
    if (!hasPermission) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }
    
    // Find user by email
    let user = await db.user.findUnique({
      where: { email }
    })
    
    // If user doesn't exist, create a new user
    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: email.split('@')[0], // Temporary name
          status: "ACTIVE"
        }
      })
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
    console.error("Error adding organization member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}