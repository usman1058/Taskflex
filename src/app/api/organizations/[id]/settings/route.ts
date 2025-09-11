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
    
    // Get organization settings
    // For now, we'll return default settings
    // In a real implementation, you would store these in a separate table
    const settings = {
      id: organization.id,
      allowPublicProjects: false,
      allowPublicTeams: false,
      allowMemberInvites: true,
      requireApprovalForJoin: false,
      defaultMemberRole: "MEMBER",
      notificationSettings: {
        newMember: true,
        projectCreated: true,
        teamCreated: true
      }
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching organization settings:", error)
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
    
    // Check if user has permission to update settings
    const currentUserMember = organization.members[0]
    const hasPermission = session.user.role === "ADMIN" || 
                         (currentUserMember && 
                          (currentUserMember.role === "OWNER" || currentUserMember.role === "ADMIN"))
    
    if (!hasPermission) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }
    
    // In a real implementation, you would update the settings in a separate table
    // For now, we'll just return success
    
    return NextResponse.json({
      id,
      ...body,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error updating organization settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}