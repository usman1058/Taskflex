import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      console.log("No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get the current user to check their role
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (!currentUser) {
      console.log("User not found in database")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    
    // Build where clause
    const where: any = {
      status: "ACTIVE" // Only return active users
    }
    
    // If the user is not a manager or admin, only show users from the same projects/teams
    if (currentUser.role !== "MANAGER" && currentUser.role !== "ADMIN") {
      // Get projects where the current user is a member
      const userProjects = await db.project.findMany({
        where: {
          members: {
            some: {
              id: session.user.id
            }
          }
        },
        select: {
          id: true,
          members: {
            select: {
              id: true
            }
          }
        }
      })
      
      // Get teams where the current user is a member
      const userTeams = await db.team.findMany({
        where: {
          members: {
            some: {
              userId: session.user.id
            }
          }
        },
        select: {
          id: true,
          members: {
            select: {
              userId: true
            }
          }
        }
      })
      
      // Collect all user IDs from projects and teams
      const projectUserIds = userProjects.flatMap(project => 
        project.members.map(member => member.id)
      )
      const teamUserIds = userTeams.flatMap(team => 
        team.members.map(member => member.userId)
      )
      
      // Combine and deduplicate
      const allUserIds = [...new Set([...projectUserIds, ...teamUserIds])]
      
      // Add the current user to the list
      allUserIds.push(session.user.id)
      
      // Filter by these user IDs
      where.id = {
        in: allUserIds
      }
    }
    
    // Add search filter if provided
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    }
    
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      },
      orderBy: { name: "asc" }
    })
    
    console.log(`Found ${users.length} users`)
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching assignees:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}