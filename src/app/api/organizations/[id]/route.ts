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
    
    const organization = await db.organization.findUnique({
      where: { id },
      include: {
        members: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        projects: {
          include: {
            _count: {
              select: {
                tasks: true,
                members: true
              }
            }
          }
        },
        teams: {
          include: {
            _count: {
              select: {
                members: true,
                tasks: true
              }
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
    
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Unwrap params Promise
    const { id } = await params
    
    const body = await request.json()
    const { name, description } = body
    
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }
    
    const updatedOrganization = await db.organization.update({
      where: { id },
      data: {
        name,
        description
      },
      include: {
        members: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        projects: {
          include: {
            _count: {
              select: {
                tasks: true,
                members: true
              }
            }
          }
        },
        teams: {
          include: {
            _count: {
              select: {
                members: true,
                tasks: true
              }
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Unwrap params Promise
    const { id } = await params
    
    await db.organization.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting organization:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}