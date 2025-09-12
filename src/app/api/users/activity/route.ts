// app/api/users/activity/route.ts
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
    
    const userId = session.user.id
    
    // Get recent activity for the user
    const activities = await Promise.all([
      // Recent tasks created by user
      db.task.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true,
          project: {
            select: {
              name: true
            }
          }
        }
      }),
      
      // Recent comments by user
      db.comment.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          content: true,
          createdAt: true,
          task: {
            select: {
              title: true,
              project: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
    ])
    
    // Format activities
    const formattedActivities = [
      ...activities[0].map(task => ({
        id: `task-${task.id}`,
        action: "created task",
        target: task.title,
        timestamp: task.createdAt,
        project: task.project?.name
      })),
      ...activities[1].map(comment => ({
        id: `comment-${comment.id}`,
        action: "commented on",
        target: comment.task.title,
        timestamp: comment.createdAt,
        project: comment.task.project?.name
      }))
    ]
    
    // Sort by timestamp and limit to 10
    formattedActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    
    return NextResponse.json(formattedActivities.slice(0, 10))
  } catch (error) {
    console.error("Error fetching user activity:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}