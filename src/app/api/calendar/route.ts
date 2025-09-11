import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isWithinInterval } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const organizationId = searchParams.get("organizationId")
    
    // If no dates provided, default to current month
    const now = new Date()
    const start = startDate ? new Date(startDate) : startOfMonth(now)
    const end = endDate ? new Date(endDate) : endOfMonth(now)
    
    console.log(`Calendar API called for user ${session.user.id} from ${start} to ${end}`)
    
    // Build the where clause based on user role and organization filter
    const whereClause: any = {}
    
    // Add organization filter if provided
    if (organizationId && organizationId !== "ALL") {
      whereClause.project = {
        organizationId: organizationId
      }
    }
    
    // Get user role to determine permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Add task assignment/creation filters based on user role
    if (user.role === "ADMIN") {
      // Admins can see all tasks
      console.log(`User ${session.user.id} is ADMIN, showing all tasks`)
    } else {
      // Regular users can only see tasks they're assigned to or created
      console.log(`User ${session.user.id} is ${user.role}, filtering by assignment/creation`)
      whereClause.OR = [
        { 
          assignees: {
            some: {
              userId: session.user.id
            }
          }
        },
        { creatorId: session.user.id }
      ]
      
      // If organization filter is provided, make sure user has access to that organization
      if (organizationId && organizationId !== "ALL") {
        const organization = await db.organization.findUnique({
          where: { id: organizationId },
          include: {
            members: {
              where: {
                userId: session.user.id
              }
            }
          }
        })
        
        if (!organization) {
          console.log(`User ${session.user.id} does not have access to organization ${organizationId}`)
          return NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 })
        }
      }
    }
    
    console.log("Final where clause:", JSON.stringify(whereClause, null, 2))
    
    // Fetch all tasks that match the criteria
    const allTasks = await db.task.findMany({
      where: whereClause,
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        project: {
          select: { 
            id: true, 
            name: true, 
            key: true,
            organizationId: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    
    console.log(`Found ${allTasks.length} total tasks`)
    
    // Filter tasks for the calendar view
    const calendarEvents = allTasks
      .filter(task => {
        // Include tasks with due dates in the range
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate)
          return isWithinInterval(dueDate, { start, end })
        }
        // Also include tasks without due dates that were created recently
        const createdDate = new Date(task.createdAt)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return !task.dueDate && isWithinInterval(createdDate, { start: thirtyDaysAgo, end })
      })
      .map(task => {
        // If task has no due date, use creation date as the event date
        const eventDate = task.dueDate || task.createdAt
        
        return {
          id: task.id,
          title: task.title,
          start: eventDate,
          end: eventDate,
          allDay: true,
          backgroundColor: getTaskColor(task.priority),
          borderColor: getTaskColor(task.priority),
          extendedProps: {
            description: task.description,
            status: task.status,
            priority: task.priority,
            projectId: task.project?.id,
            projectName: task.project?.name,
            projectKey: task.project?.key,
            organizationId: task.project?.organizationId,
            assigneeName: task.assignees?.[0]?.user.name,
            assigneeEmail: task.assignees?.[0]?.user.email,
            creatorName: task.creator.name,
            creatorEmail: task.creator.email,
            hasDueDate: !!task.dueDate
          }
        }
      })
    
    console.log(`Returning ${calendarEvents.length} calendar events`)
    
    return NextResponse.json(calendarEvents)
  } catch (error) {
    console.error("Error fetching calendar events:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function getTaskColor(priority: string) {
  switch (priority) {
    case "LOW": return "#94a3b8"    // slate-500
    case "MEDIUM": return "#3b82f6"  // blue-500
    case "HIGH": return "#f97316"    // orange-500
    case "URGENT": return "#ef4444"  // red-500
    default: return "#94a3b8"        // slate-500
  }
}