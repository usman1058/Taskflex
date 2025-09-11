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
    
    // Get all users that can be added to the organization
    const users = await db.user.findMany({
      where: {
        // Exclude users who are already members
        NOT: {
          organizationMemberships: {
            some: {
              organizationId: id
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true
      },
      orderBy: { name: "asc" }
    })
    
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching organization users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}