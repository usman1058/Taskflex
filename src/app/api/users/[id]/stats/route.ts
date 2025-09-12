// app/api/users/[id]/stats/route.ts
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
    
    // Check if user exists
    const user = await db.user.findUnique({
      where: { id }
    })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Get user-specific stats
    const [totalTasks, completedTasks, inProgressTasks, overdueTasks, projectsCount, teamsCount] = await Promise.all([
      // Total tasks assigned to user or created by user
      db.task.count({
        where: {
          OR: [
            { assignees: { some: { userId: id } } },
            { creatorId: id }
          ]
        }
      }),
      
      // Completed tasks
      db.task.count({
        where: {
          OR: [
            { assignees: { some: { userId: id } } },
            { creatorId: id }
          ],
          status: "DONE"
        }
      }),
      
      // In progress tasks
      db.task.count({
        where: {
          OR: [
            { assignees: { some: { userId: id } } },
            { creatorId: id }
          ],
          status: "IN_PROGRESS"
        }
      }),
      
      // Overdue tasks
      db.task.count({
        where: {
          OR: [
            { assignees: { some: { userId: id } } },
            { creatorId: id }
          ],
          dueDate: {
            lt: new Date()
          },
          status: {
            not: "DONE"
          }
        }
      }),
      
      // Projects user is member of
      db.project.count({
        where: {
          members: {
            some: {
              id: id
            }
          }
        }
      }),
      
      // Teams user is member of
      db.team.count({
        where: {
          members: {
            some: {
              userId: id
            }
          }
        }
      })
    ])
    
    return NextResponse.json({
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      projectsCount,
      teamsCount
    })
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}