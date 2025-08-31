// app/api/tasks/route.ts
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
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const search = searchParams.get("search")
    const skip = (page - 1) * limit
    
    // Get user role to determine permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Build where clause based on user role
    const where: any = {}
    
    // Managers and admins can see all tasks
    if (user.role === "MANAGER" || user.role === "ADMIN") {
      // No additional filtering needed for managers and admins
    } else {
      // Regular users can only see tasks they're assigned to or created
      where.OR = [
        { assigneeId: session.user.id },
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
          assignee: {
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
      assigneeId,
      projectId,
      tags = []
    } = body
    
    console.log("Received data:", {
      title,
      description,
      type,
      status,
      priority,
      dueDate,
      assigneeId,
      projectId,
      tags,
      creatorId: session.user.id
    })
    
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }
    
    // Handle special values
    const finalAssigneeId = assigneeId === "unassigned" || assigneeId === "" ? null : assigneeId
    const finalProjectId = projectId === "noproject" || projectId === "" ? null : projectId
    
    console.log("Processed data:", {
      finalAssigneeId,
      finalProjectId,
      creatorId: session.user.id
    })
    
    // Validate that the assignee exists if provided
    if (finalAssigneeId) {
      try {
        console.log("Checking assignee exists:", finalAssigneeId)
        const assignee = await db.user.findUnique({
          where: { id: finalAssigneeId }
        })
        console.log("Assignee found:", assignee)
        if (!assignee) {
          return NextResponse.json(
            { error: "Assignee not found" },
            { status: 400 }
          )
        }
      } catch (error) {
        console.error("Error validating assignee:", error)
        return NextResponse.json(
          { error: "Invalid assignee ID" },
          { status: 400 }
        )
      }
    }
    
    // Validate that the project exists if provided
    if (finalProjectId) {
      try {
        console.log("Checking project exists:", finalProjectId)
        const project = await db.project.findUnique({
          where: { id: finalProjectId }
        })
        console.log("Project found:", project)
        if (!project) {
          return NextResponse.json(
            { error: "Project not found" },
            { status: 400 }
          )
        }
      } catch (error) {
        console.error("Error validating project:", error)
        return NextResponse.json(
          { error: "Invalid project ID" },
          { status: 400 }
        )
      }
    }
    
    // Validate that the creator exists
    try {
      console.log("Checking creator exists:", session.user.id)
      const creator = await db.user.findUnique({
        where: { id: session.user.id }
      })
      console.log("Creator found:", creator)
      if (!creator) {
        return NextResponse.json(
          { error: "Creator not found" },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error("Error validating creator:", error)
      return NextResponse.json(
        { error: "Invalid creator ID" },
        { status: 400 }
      )
    }
    
    console.log("All validations passed. Creating task...")
    
    // Create the task
    const task = await db.task.create({
      data: {
        title,
        description,
        type,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: finalAssigneeId,
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
        }
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        project: {
          select: { id: true, name: true, key: true }
        },
        taskTags: {
          include: {
            tag: true
          }
        }
      }
    })
    
    console.log("Task created successfully:", task)
    
    // Create notifications
    
    // 1. Notify the assignee if task is assigned to someone else
    if (finalAssigneeId && finalAssigneeId !== session.user.id) {
      await db.notification.create({
        data: {
          title: "New Task Assigned",
          message: `You have been assigned to "${title}"`,
          type: "TASK_ASSIGNED",
          userId: finalAssigneeId
        }
      })
    }
    
    // 2. If task is part of a project, notify project members
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
          // Don't notify the assignee twice
          if (member.id !== finalAssigneeId) {
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
    
    // 3. If task is part of a team, notify team members
    if (task.teamId) {
      const teamMembers = await db.teamMembership.findMany({
        where: {
          teamId: task.teamId,
          userId: {
            not: session.user.id // Exclude the creator
          }
        },
        select: { userId: true }
      })
      
      if (teamMembers.length > 0) {
        for (const member of teamMembers) {
          // Don't notify the assignee twice
          if (member.userId !== finalAssigneeId) {
            await db.notification.create({
              data: {
                title: "New Task in Team",
                message: `A new task "${title}" has been added to the team`,
                type: "TASK_UPDATED",
                userId: member.userId
              }
            })
          }
        }
      }
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