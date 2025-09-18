// app/api/organizations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const organization = await db.organization.findUnique({
      where: { id: params.id },
      include: {
        members: {
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
        },
        projects: {
          select: { 
            id: true, 
            name: true, 
            key: true,
            status: true,
            createdAt: true,
            _count: {
              select: {
                tasks: true,
                members: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        teams: {
          select: { 
            id: true, 
            name: true, 
            status: true,
            createdAt: true,
            _count: {
              select: {
                members: true,
                tasks: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        _count: {
          select: {
            projects: true,
            teams: true,
            members: true
          }
        }
      }
    })
    
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }
    
    // Check if user has permission to view this organization
    const isMember = organization.members.some(member => member.user.id === session.user.id)
    const isAdmin = session.user.role === "ADMIN"
    
    if (!isMember && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    return NextResponse.json(organization)
  } catch (error) {
    console.error("Error fetching organization:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if the organization exists and user has permission
    const organization = await db.organization.findUnique({
      where: { id: params.id },
      include: {
        members: {
          select: {
            userId: true,
            role: true
          }
        }
      }
    })
    
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }
    
    // Check if user has permission to update this organization
    const userMembership = organization.members.find(member => member.userId === session.user.id)
    const hasPermission = session.user.role === "ADMIN" || 
                         (userMembership && (userMembership.role === "OWNER" || userMembership.role === "ADMIN"))
    
    if (!hasPermission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    const body = await request.json()
    const { 
      name, 
      description, 
      type,
      industry,
      size,
      website,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      timezone
    } = body
    
    // Update the organization
    const updatedOrganization = await db.organization.update({
      where: { id: params.id },
      data: {
        name,
        description,
        type,
        industry,
        size,
        website,
        phone,
        address,
        city,
        state,
        country,
        postalCode,
        timezone
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        _count: {
          select: {
            projects: true,
            teams: true,
            members: true
          }
        }
      }
    })
    
    return NextResponse.json(updatedOrganization)
  } catch (error) {
    console.error("Error updating organization:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if the organization exists
    const organization = await db.organization.findUnique({
      where: { id: params.id },
      include: {
        members: {
          select: {
            userId: true,
            role: true
          }
        }
      }
    })
    
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }
    
    // Check if user has permission to delete this organization
    const userMembership = organization.members.find(member => member.userId === session.user.id)
    const hasPermission = session.user.role === "ADMIN" || 
                         (userMembership && userMembership.role === "OWNER")
    
    if (!hasPermission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    // Get admin key from headers
    const adminKey = request.headers.get("X-Admin-Key")
    
    if (!adminKey) {
      return NextResponse.json({ error: "Admin key is required" }, { status: 400 })
    }
    
    // Verify admin key
    if (adminKey !== organization.adminKey) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }
    
    // Delete the organization (this will cascade delete related records)
    await db.organization.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: "Organization deleted successfully" })
  } catch (error) {
    console.error("Error deleting organization:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}