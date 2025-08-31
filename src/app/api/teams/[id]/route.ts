// app/api/teams/[id]/route.ts
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
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const team = await db.team.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        projects: {
          include: {
            _count: {
              select: {
                tasks: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            projects: true
          }
        }
      }
    })
    
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }
    
    // Check if user is a member of the team
    const isMember = team.ownerId === session.user.id || 
                     team.members.some(member => member.userId === session.user.id)
    
    if (!isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    return NextResponse.json(team)
  } catch (error) {
    console.error("Error fetching team:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}