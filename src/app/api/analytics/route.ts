// app/api/analytics/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { startOfWeek, endOfWeek, subWeeks, format, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, subMonths } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const weeks = parseInt(searchParams.get("weeks") || "4")
    const months = parseInt(searchParams.get("months") || "6")
    const organizationId = searchParams.get("organizationId")
    
    // Get user role to determine permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Build the base where clause for tasks
    const baseTaskWhere: any = {
      OR: [
        { assignees: { some: { userId: session.user.id } } },
        { creatorId: session.user.id }
      ]
    }
    
    // Add organization filter if provided
    if (organizationId && organizationId !== "ALL") {
      baseTaskWhere.project = {
        organizationId: organizationId
      }
    }
    
    // Fetch all analytics data in parallel
    const [taskAnalytics, productivityAnalytics, teamAnalytics] = await Promise.all([
      getTaskAnalytics(baseTaskWhere, months, organizationId, user),
      getProductivityAnalytics(baseTaskWhere, weeks),
      user.role === "MANAGER" || user.role === "ADMIN" 
        ? getTeamAnalytics(organizationId, user) 
        : Promise.resolve(null)
    ])
    
    return NextResponse.json({
      taskAnalytics,
      productivityAnalytics,
      teamAnalytics
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

async function getTaskAnalytics(baseWhere: any, months: number, organizationId: string | null, user: any) {
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
  
  return {
    tasksByStatus,
    tasksByPriority,
    tasksByProject: tasksByProjectWithDetails,
    tasksByOrganization,
    tasksByMonth: monthsData,
    tasksByType
  }
}

async function getProductivityAnalytics(baseWhere: any, weeks: number) {
  // Get tasks completed per day for the last N weeks
  const now = new Date()
  const startOfCurrentWeek = startOfWeek(now)
  const endOfCurrentWeek = endOfWeek(now)
  
  const weeksData = []
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i))
    const weekEnd = endOfWeek(subWeeks(now, i))
    
    const daysInWeek = eachDayOfInterval({
      start: weekStart,
      end: weekEnd
    })
    
    const dailyCompletions = await Promise.all(
      daysInWeek.map(async (day) => {
        const completedTasks = await db.task.count({
          where: {
            ...baseWhere,
            status: "DONE",
            updatedAt: {
              gte: day,
              lt: new Date(day.getTime() + 24 * 60 * 60 * 1000) // Next day
            }
          }
        })
        
        return {
          day: format(day, "EEE"),
          date: format(day, "yyyy-MM-dd"),
          completedTasks
        }
      })
    )
    
    const weekTotal = dailyCompletions.reduce((sum, day) => sum + day.completedTasks, 0)
    
    weeksData.push({
      week: `Week ${weeks - i}`,
      weekStart: format(weekStart, "MMM dd"),
      weekEnd: format(weekEnd, "MMM dd"),
      dailyCompletions,
      weekTotal
    })
  }
  
  // Get average time to complete tasks
  const completedTasks = await db.task.findMany({
    where: {
      ...baseWhere,
      status: "DONE"
    },
    select: {
      createdAt: true,
      updatedAt: true
    }
  })
  
  const completionTimes = completedTasks.map(task => {
    const created = new Date(task.createdAt).getTime()
    const completed = new Date(task.updatedAt).getTime()
    return (completed - created) / (1000 * 60 * 60 * 24) // Convert to days
  })
  
  const avgCompletionTime = completionTimes.length > 0
    ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
    : 0
  
  // Get current streak of completed tasks
  const sortedTasks = await db.task.findMany({
    where: {
      ...baseWhere,
      status: "DONE"
    },
    orderBy: {
      updatedAt: "desc"
    },
    select: {
      updatedAt: true
    }
  })
  
  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  
  for (const task of sortedTasks) {
    const taskDate = new Date(task.updatedAt)
    taskDate.setHours(0, 0, 0, 0)
    
    const diffDays = Math.floor((currentDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === streak) {
      streak++
    } else {
      break
    }
  }
  
  return {
    weeklyProductivity: weeksData,
    avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
    currentStreak: streak,
    totalCompleted: completedTasks.length
  }
}

async function getTeamAnalytics(organizationId: string | null, user: any) {
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
    const orgStatusData = organizations.map(org => {
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
    const statusGroups = orgStatusData.reduce((acc, item) => {
      if (!acc[item.status]) {
        acc[item.status] = []
      }
      acc[item.status].push(item)
      return acc
    }, {} as Record<string, typeof orgStatusData>)
    
    // Convert to the expected format
    organizationStatus = Object.entries(statusGroups).map(([status, items]) => ({
      status,
      _count: { id: items.length }
    }))
  }
  
  // Get task distribution by assignee - manual grouping since we can't use groupBy on relations
  // Fixed: Removed the userId filter since we're already checking for assignees with userId in the grouping
  const tasksByAssigneeData = await db.task.findMany({
    where: {
      assignees: {
        some: {} // Just check that there are assignees
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
  
  // Group tasks by assignee manually and filter out null user IDs
  const assigneeGroups = tasksByAssigneeData.reduce((acc, task) => {
    task.assignees.forEach(assignee => {
      if (assignee.user && assignee.user.id) { // Only include if user and user.id exist
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
  
  return {
    teamProductivity,
    projectStatus,
    organizationStatus,
    tasksByAssignee
  }
}