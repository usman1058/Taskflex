// app/api/analytics/team/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user is a manager or admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (!user || (user.role !== "MANAGER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get team member productivity
    const teamMembers = await db.user.findMany({
      where: {
        role: {
          in: ["USER", "AGENT"]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    })
    
    const teamProductivity = await Promise.all(
      teamMembers.map(async (member) => {
        const assignedTasks = await db.task.count({
          where: { assigneeId: member.id }
        })
        
        const completedTasks = await db.task.count({
          where: {
            assigneeId: member.id,
            status: "DONE"
          }
        })
        
        const overdueTasks = await db.task.count({
          where: {
            assigneeId: member.id,
            dueDate: {
              lt: new Date()
            },
            status: {
              not: "DONE"
            }
          }
        })
        
        return {
          ...member,
          assignedTasks,
          completedTasks,
          overdueTasks,
          completionRate: assignedTasks > 0 
            ? Math.round((completedTasks / assignedTasks) * 100) 
            : 0
        }
      })
    )
    
    // Sort by completion rate
    teamProductivity.sort((a, b) => b.completionRate - a.completionRate)
    
    // Get project status distribution
    const projectStatus = await db.project.groupBy({
      by: ["status"],
      _count: {
        id: true
      }
    })
    
    // Get task distribution by assignee
    const tasksByAssignee = await db.task.groupBy({
      by: ["assigneeId"],
      where: {
        assigneeId: {
          not: null
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: "desc"
        }
      },
      take: 5
    })
    
    // Get assignee details
    const assigneeIds = tasksByAssignee.map(t => t.assigneeId).filter(Boolean) as string[]
    const assignees = await db.user.findMany({
      where: {
        id: {
          in: assigneeIds
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })
    
    // Map assignee details to the tasksByAssignee result
    const tasksByAssigneeWithDetails = tasksByAssignee.map(item => {
      const assignee = assignees.find(a => a.id === item.assigneeId)
      return {
        ...item,
        assignee
      }
    })
    
    return NextResponse.json({
      teamProductivity,
      projectStatus,
      tasksByAssignee: tasksByAssigneeWithDetails
    })
  } catch (error) {
    console.error("Error fetching team analytics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}