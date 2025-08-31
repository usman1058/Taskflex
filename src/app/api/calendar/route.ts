// app/api/calendar/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    
    // If no dates provided, default to current month
    const now = new Date()
    const start = startDate ? new Date(startDate) : startOfMonth(now)
    const end = endDate ? new Date(endDate) : endOfMonth(now)
    
    const tasks = await db.task.findMany({
      where: {
        OR: [
          {
            assigneeId: session.user.id,
            dueDate: {
              not: null,
              gte: start,
              lte: end
            }
          },
          {
            creatorId: session.user.id,
            dueDate: {
              not: null,
              gte: start,
              lte: end
            }
          }
        ]
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        project: {
          select: { id: true, name: true, key: true }
        }
      },
      orderBy: { dueDate: "asc" }
    })
    
    // Format tasks for calendar
    const calendarEvents = tasks.map(task => ({
      id: task.id,
      title: task.title,
      start: task.dueDate,
      end: task.dueDate,
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
        assigneeName: task.assignee?.name,
        assigneeEmail: task.assignee?.email
      }
    }))
    
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