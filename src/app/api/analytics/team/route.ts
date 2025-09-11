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
    
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId")
    
    // Build the base where clause
    const baseWhere: any = {}
    
    // Add organization filter if provided
    if (organizationId && organizationId !== "ALL") {
      baseWhere.project = {
        organizationId: organizationId
      }
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
          where: {
            assignees: {
              some: {
                userId: member.id
              }
            },
            ...baseWhere
          }
        })
        
        const completedTasks = await db.task.count({
          where: {
            assignees: {
              some: {
                userId: member.id
              }
            },
            status: "DONE",
            ...baseWhere
          }
        })
        
        const overdueTasks = await db.task.count({
          where: {
            assignees: {
              some: {
                userId: member.id
              }
            },
            dueDate: {
              lt: new Date()
            },
            status: {
              not: "DONE"
            },
            ...baseWhere
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
      where: baseWhere,
      _count: {
        id: true
      }
    })
    
    // Get organization status distribution (only if not filtering by a specific organization)
    let organizationStatus = []
    if (!organizationId || organizationId === "ALL") {
      // Since Organization doesn't have a status field, we'll calculate it based on projects
      const organizations = await db.organization.findMany({
        include: {
          projects: {
            select: {
              status: true
            }
          }
        }
      })
      
      // Calculate organization status based on projects
      organizationStatus = organizations.map(org => {
        const totalProjects = org.projects.length
        const activeProjects = org.projects.filter(p => p.status === "ACTIVE").length
        
        let status = "ACTIVE"
        if (totalProjects === 0) {
          status = "INACTIVE"
        } else if (activeProjects === 0) {
          status = "INACTIVE"
        } else if (activeProjects === totalProjects) {
          status = "ACTIVE"
        }
        
        return {
          status,
          _count: { id: 1 }
        }
      })
      
      // Group by status
      const statusGroups = organizationStatus.reduce((acc, item) => {
        if (!acc[item.status]) {
          acc[item.status] = []
        }
        acc[item.status].push(item)
        return acc
      }, {} as Record<string, typeof organizationStatus>)
      
      // Convert to the expected format
      organizationStatus = Object.entries(statusGroups).map(([status, items]) => ({
        status,
        _count: { id: items.length }
      }))
    }
    
    // Get task distribution by assignee - manual grouping since we can't use groupBy on relations
    const tasksByAssigneeData = await db.task.findMany({
      where: {
        assignees: {
          some: {
            userId: {
              not: null
            }
          }
        },
        ...baseWhere
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })
    
    // Group tasks by assignee manually
    const assigneeGroups = tasksByAssigneeData.reduce((acc, task) => {
      task.assignees.forEach(assignee => {
        if (assignee.user) {
          if (!acc[assignee.user.id]) {
            acc[assignee.user.id] = []
          }
          acc[assignee.user.id].push(task)
        }
      })
      return acc
    }, {} as Record<string, typeof tasksByAssigneeData>)
    
    // Convert to the expected format and sort by task count
    const tasksByAssignee = Object.entries(assigneeGroups)
      .map(([assigneeId, tasks]) => ({
        assigneeId,
        _count: { id: tasks.length },
        assignee: tasks[0]?.assignees[0]?.user
      }))
      .sort((a, b) => b._count.id - a._count.id)
      .slice(0, 5)
    
    return NextResponse.json({
      teamProductivity,
      projectStatus,
      organizationStatus,
      tasksByAssignee
    })
  } catch (error) {
    console.error("Error fetching team analytics:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}