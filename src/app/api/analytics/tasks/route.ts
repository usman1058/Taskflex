import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get("months") || "6")
    const organizationId = searchParams.get("organizationId")
    
    // Build the base where clause
    const baseWhere: any = {
      OR: [
        { assignees: { some: { userId: session.user.id } } },
        { creatorId: session.user.id }
      ]
    }
    
    // Add organization filter if provided
    if (organizationId && organizationId !== "ALL") {
      baseWhere.project = {
        organizationId: organizationId
      }
    }
    
    // Get tasks by status
    const tasksByStatus = await db.task.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: {
        id: true
      }
    })
    
    // Get tasks by priority
    const tasksByPriority = await db.task.groupBy({
      by: ["priority"],
      where: baseWhere,
      _count: {
        id: true
      }
    })
    
    // Get tasks by project
    const tasksByProject = await db.task.groupBy({
      by: ["projectId"],
      where: baseWhere,
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
    
    // Get project details for the top projects
    const projectIds = tasksByProject.map(p => p.projectId).filter(Boolean) as string[]
    const projects = await db.project.findMany({
      where: {
        id: {
          in: projectIds
        }
      },
      select: {
        id: true,
        name: true,
        key: true
      }
    })
    
    // Map project details to the tasksByProject result
    const tasksByProjectWithDetails = tasksByProject.map(item => {
      const project = projects.find(p => p.id === item.projectId)
      return {
        ...item,
        project
      }
    })
    
    // Get tasks by organization (only if not filtering by a specific organization)
    let tasksByOrganization = []
    if (!organizationId || organizationId === "ALL") {
      const tasksByOrg = await db.task.findMany({
        where: {
          ...baseWhere,
          project: {
            organizationId: {
              not: null
            }
          }
        },
        include: {
          project: {
            select: {
              organizationId: true
            }
          }
        }
      })
      
      // Group by organizationId
      const orgGroups = tasksByOrg.reduce((acc, task) => {
        const orgId = task.project?.organizationId
        if (orgId) {
          if (!acc[orgId]) {
            acc[orgId] = []
          }
          acc[orgId].push(task)
        }
        return acc
      }, {} as Record<string, typeof tasksByOrg>)
      
      // Get organization details
      const organizationIds = Object.keys(orgGroups)
      const organizations = await db.organization.findMany({
        where: {
          id: {
            in: organizationIds
          }
        },
        select: {
          id: true,
          name: true
        }
      })
      
      // Map organization details to the result
      tasksByOrganization = Object.entries(orgGroups).map(([orgId, tasks]) => {
        const organization = organizations.find(o => o.id === orgId)
        return {
          organizationId: orgId,
          _count: { id: tasks.length },
          organization
        }
      })
    }
    
    // Get tasks completed per month for the last N months
    const now = new Date()
    const monthsData = []
    
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = endOfMonth(subMonths(now, i))
      
      const completedTasks = await db.task.count({
        where: {
          status: "DONE",
          ...baseWhere,
          updatedAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })
      
      monthsData.push({
        month: format(monthStart, "MMM yyyy"),
        completedTasks
      })
    }
    
    // Get task distribution by type
    const tasksByType = await db.task.groupBy({
      by: ["type"],
      where: baseWhere,
      _count: {
        id: true
      }
    })
    
    return NextResponse.json({
      tasksByStatus,
      tasksByPriority,
      tasksByProject: tasksByProjectWithDetails,
      tasksByOrganization,
      tasksByMonth: monthsData,
      tasksByType
    })
  } catch (error) {
    console.error("Error fetching task analytics:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}