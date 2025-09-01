// app/api/organizations/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get organizations where user is a member
    const organizations = await db.organization.findMany({
      where: {
        members: {
          some: { userId: session.user.id }
        }
      },
      include: {
        members: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        projects: {
          select: { id: true, name: true, key: string }
        },
        teams: {
          select: { id: true, name: string }
        },
        _count: {
          select: {
            projects: true,
            teams: true,
            members: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    
    return NextResponse.json(organizations)
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}