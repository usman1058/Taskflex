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
    
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const search = searchParams.get("search")
    const skip = (page - 1) * limit
    
    // Build where clause based on user role
    const where: any = {}
    
    // Managers and admins can see all tasks
    if (user.role === "MANAGER" || user.role === "ADMIN") {
      // No additional filtering needed for managers and admins
    } else {
      // Regular users can only see tasks they're assigned to or created
      where.OR = [
        { 
          assignees: {
            some: {
              userId: session.user.id
            }
          }
        },
        { creatorId: session.user.id }
      ]
    }
    
    // Add status filter if provided
    if (status && status !== "all") {
      where.status = status
    }
    
    // Add priority filter if provided
    if (priority && priority !== "all") {
      where.priority = priority
    }
    
    // Add search filter if provided
    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } }
          ]
        }
      ]
    }
    
    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true, avatar: true }
          },
          project: {
            select: { id: true, name: true, key: true }
          },
          taskTags: {
            include: {
              tag: true
            }
          },
          parentTask: {
            select: {
              id: true,
              title: true
            }
          },
          subtasks: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          assignees: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true }
              }
            }
          },
          _count: {
            select: {
              comments: true,
              attachments: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.task.count({ where })
    ])
    
    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const {
      title,
      description,
      type = "TASK",
      status = "OPEN",
      priority = "MEDIUM",
      dueDate,
      assigneeIds = [], // Array of user IDs
      projectId,
      tags = [],
      attachments = []
    } = body
    
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }
    
    // Handle special values
    const finalProjectId = projectId === "noproject" || projectId === "" ? null : projectId
    
    // Validate that the project exists if provided
    if (finalProjectId) {
      const project = await db.project.findUnique({
        where: { id: finalProjectId }
      })
      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 400 }
        )
      }
    }
    
    // Create the task
    const task = await db.task.create({
      data: {
        title,
        description,
        type,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: finalProjectId,
        creatorId: session.user.id,
        taskTags: {
          create: tags.map((tagName: string) => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName, color: "#6366f1" }
              }
            }
          }))
        },
        attachments: {
          create: attachments.map((attachment: any) => ({
            filename: attachment.filename,
            fileSize: attachment.fileSize,
            mimeType: attachment.mimeType,
            path: attachment.path
          }))
        }
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        project: {
          select: { id: true, name: true, key: true }
        },
        taskTags: {
          include: {
            tag: true
          }
        },
        attachments: true,
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      }
    })
    
    // Add assignees to the task
    if (assigneeIds.length > 0) {
      await db.taskAssignee.createMany({
        data: assigneeIds.map((userId: string) => ({
          taskId: task.id,
          userId
        }))
      })
    } else {
      // If no assignees are specified, assign the task to the creator
      await db.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: session.user.id
        }
      })
    }
    
    // Create notifications for each assignee
    if (assigneeIds.length > 0) {
      for (const userId of assigneeIds) {
        // Don't notify the creator if they're also an assignee
        if (userId !== session.user.id) {
          await db.notification.create({
            data: {
              title: "New Task Assigned",
              message: `You have been assigned to "${title}"`,
              type: "TASK_ASSIGNED",
              userId
            }
          })
        }
      }
    }
    
    // If task is part of a project, notify project members
    if (finalProjectId) {
      const projectMembers = await db.project.findUnique({
        where: { id: finalProjectId },
        include: {
          members: {
            where: {
              id: {
                not: session.user.id // Exclude the creator
              }
            },
            select: { id: true }
          }
        }
      })
      
      if (projectMembers && projectMembers.members.length > 0) {
        for (const member of projectMembers.members) {
          // Don't notify assignees twice
          if (!assigneeIds.includes(member.id)) {
            await db.notification.create({
              data: {
                title: "New Task in Project",
                message: `A new task "${title}" has been added to the project`,
                type: "TASK_UPDATED",
                userId: member.id
              }
            })
          }
        }
      }
    }
    
    // Fetch the task again with assignees included
    const taskWithAssignees = await db.task.findUnique({
      where: { id: task.id },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        project: {
          select: { id: true, name: true, key: true }
        },
        taskTags: {
          include: {
            tag: true
          }
        },
        attachments: true,
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      }
    })
    
    return NextResponse.json(taskWithAssignees, { status: 201 })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}