// app/api/teams/[id]/tasks/route.ts
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

    const { id } = await params
    const teamId = id

    // Check if user is a member of the team
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: {
            userId: session.user.id
          }
        }
      }
    })

    if (!team || (team.members.length === 0 && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Team not found or access denied" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")

    const where: any = {
      teamId
    }

    if (status && status !== "ALL") {
      where.status = status
    }

    if (priority && priority !== "ALL") {
      where.priority = priority
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            key: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching team tasks:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const teamId = id
    const body = await request.json()

    // Check if user is a member of the team and has permission to create tasks
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: {
            userId: session.user.id
          }
        }
      }
    })

    if (!team || (team.members.length === 0 && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Team not found or access denied" }, { status: 404 })
    }

    // Check if user has permission to create tasks (OWNER or ADMIN)
    const member = team.members[0]
    if (member && member.role !== "OWNER" && member.role !== "ADMIN" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Create the task
    const task = await db.task.create({
      data: {
        title: body.title,
        description: body.description,
        status: body.status || "TODO",
        priority: body.priority || "MEDIUM",
        type: body.type || "TASK",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        teamId,
        creatorId: session.user.id,
        projectId: body.projectId || null
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    // If assignees are provided, create assignments
    if (body.assigneeIds && body.assigneeIds.length > 0) {
      await db.taskAssignment.createMany({
        data: body.assigneeIds.map((assigneeId: string) => ({
          taskId: task.id,
          userId: assigneeId
        }))
      })

      // Fetch the updated task with assignees
      const updatedTask = await db.task.findUnique({
        where: { id: task.id },
        include: {
          assignees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true
                }
              }
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      })

      return NextResponse.json(updatedTask, { status: 201 })
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}