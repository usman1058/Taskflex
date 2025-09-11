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
    
    // Get all members with their roles
    const members = await db.organizationMember.findMany({
      where: { organizationId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
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
    const { userId, role = "MEMBER" } = body
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
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
    
    // Check if user is already a member
    const existingMember = await db.organizationMember.findUnique({
      where: {
        userId,
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
        userId,
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
        userId
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

export async function PUT(
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
    const { userId, role } = body
    
    if (!userId || !role) {
      return NextResponse.json(
        { error: "User ID and role are required" },
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
    
    // Check if user has permission to update roles
    const currentUserMember = organization.members[0]
    const hasPermission = session.user.role === "ADMIN" || 
                         (currentUserMember && 
                          (currentUserMember.role === "OWNER" || currentUserMember.role === "ADMIN"))
    
    if (!hasPermission) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }
    
    // Check if user is trying to change their own role to a lower level
    if (userId === session.user.id) {
      const currentRole = currentUserMember.role
      const roleHierarchy = { "OWNER": 4, "ADMIN": 3, "MANAGER": 2, "MEMBER": 1 }
      
      if (roleHierarchy[currentRole as keyof typeof roleHierarchy] < roleHierarchy[role as keyof typeof roleHierarchy]) {
        return NextResponse.json(
          { error: "You cannot downgrade your own role" },
          { status: 400 }
        )
      }
    }
    
    // Update member role
    const updatedMember = await db.organizationMember.update({
      where: {
        userId_organizationId: {
          userId,
          organizationId: id
        }
      },
      data: {
        role
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })
    
    // Create notification for role change
    await db.notification.create({
      data: {
        title: "Organization Role Updated",
        message: `Your role in ${organization.name} has been updated to ${role}`,
        type: "SYSTEM",
        userId
      }
    })
    
    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error("Error updating organization member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
export async function DELETE(
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
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
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
    
    // Check if user has permission to remove members
    const currentUserMember = organization.members[0]
    const hasPermission = session.user.role === "ADMIN" || 
                         (currentUserMember && 
                          (currentUserMember.role === "OWNER" || currentUserMember.role === "ADMIN")) ||
                         session.user.id === userId // Users can remove themselves
    
    if (!hasPermission) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }
    
    // Remove user from organization
    await db.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId: id
        }
      }
    })
    
    // Create notification for removal (if not removing self)
    if (session.user.id !== userId) {
      await db.notification.create({
        data: {
          title: "Removed from Organization",
          message: `You have been removed from the organization "${organization.name}"`,
          type: "SYSTEM",
          userId
        }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing organization member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}