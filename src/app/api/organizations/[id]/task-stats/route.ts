// app/api/organizations/[id]/task-stats/route.ts
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
    
    // Unwrap params Promise
    const { id } = await params
    
    // Check if organization exists and user has permission
    const organization = await db.organization.findUnique({
      where: { id },
      include: {
        members: {
          where: {
            userId: session.user.id
          }
        }
      }
    })
    
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }
    
    // Check if user has permission to view this organization
    const isMember = organization.members.length > 0
    const isAdmin = session.user.role === "ADMIN"
    
    if (!isMember && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    // Get task statistics
    const totalTasks = await db.task.count({
      where: {
        project: {
          organizationId: id
        }
      }
    })
    
    const completedTasks = await db.task.count({
      where: {
        project: {
          organizationId: id
        },
        status: "DONE"
      }
    })
    
    const inProgressTasks = await db.task.count({
      where: {
        project: {
          organizationId: id
        },
        status: "IN_PROGRESS"
      }
    })
    
    const overdueTasks = await db.task.count({
      where: {
        project: {
          organizationId: id
        },
        dueDate: {
          lt: new Date()
        },
        status: {
          not: "DONE"
        }
      }
    })
    
    return NextResponse.json({
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      overdue: overdueTasks
    })
  } catch (error) {
    console.error("Error fetching task stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}