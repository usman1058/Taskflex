// app/api/teams/[id]/projects/route.ts
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
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const teamId = id

    // Check if user is a member of the team
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: {
            userId: session.user.id
          }
        }
      }
    })

    if (!team || (team.members.length === 0 && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Team not found or access denied" }, { status: 404 })
    }

    const projects = await db.project.findMany({
      where: { teamId },
      select: {
        id: true,
        name: true,
        key: true
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching team projects:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}