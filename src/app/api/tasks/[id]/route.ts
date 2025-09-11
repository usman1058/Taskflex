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
    
    const resolvedParams = await params
    const taskId = resolvedParams.id
    
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }
    
    // Check if user has permission to view this task
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const canView = 
      user.role === "ADMIN" || 
      user.role === "MANAGER" || 
      await db.task.findFirst({
        where: {
          id: taskId,
          OR: [
            { creatorId: session.user.id },
            { assignees: { some: { userId: session.user.id } } }
          ]
        }
      })
    
    if (!canView) {
      return NextResponse.json({ error: "You don't have permission to view this task" }, { status: 403 })
    }
    
    const task = await db.task.findUnique({
      where: { id: taskId },
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
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          },
          orderBy: { createdAt: "asc" }
        },
        attachments: true,
        timeEntries: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { date: "desc" }
        },
        watchers: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      }
    })
    
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    
    return NextResponse.json(task)
  } catch (error) {
    console.error("Error fetching task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const resolvedParams = await params
    const body = await request.json()
    const {
      title,
      description,
      type,
      status,
      priority,
      dueDate,
      assigneeIds = [], // Array of user IDs
      projectId,
      teamId,
      parentTaskId,
      tags
    } = body
    
    // Check if task exists and user has permission to edit it
    const existingTask = await db.task.findUnique({
      where: { id: resolvedParams.id },
      include: {
        creator: {
          select: { id: true }
        },
        assignees: {
          include: {
            user: { select: { id: true } }
          }
        }
      }
    })
    
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    
    // Check if user has permission to edit this task
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const canEdit = 
      user.role === "ADMIN" || 
      user.role === "MANAGER" || 
      existingTask.creatorId === session.user.id ||
      existingTask.assignees.some(assignee => assignee.user.id === session.user.id)
    
    if (!canEdit) {
      return NextResponse.json({ error: "You don't have permission to edit this task" }, { status: 403 })
    }
    
    // Update the task
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (projectId !== undefined) updateData.projectId = projectId === "" ? null : projectId
    if (teamId !== undefined) updateData.teamId = teamId === "" ? null : teamId
    if (parentTaskId !== undefined) updateData.parentTaskId = parentTaskId === "" ? null : parentTaskId
    
    const task = await db.task.update({
      where: { id: resolvedParams.id },
      data: updateData,
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
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      }
    })
    
    // Update assignees if provided
    if (assigneeIds !== undefined) {
      // Remove existing assignees
      await db.taskAssignee.deleteMany({
        where: { taskId: resolvedParams.id }
      })
      
      // Add new assignees
      if (assigneeIds.length > 0) {
        await db.taskAssignee.createMany({
          data: assigneeIds.map((userId: string) => ({
            taskId: resolvedParams.id,
            userId
          }))
        })
      } else {
        // If no assignees are specified, assign the task to the creator
        await db.taskAssignee.create({
          data: {
            taskId: resolvedParams.id,
            userId: session.user.id
          }
        })
      }
    }
    
    // Update tags if provided
    if (tags !== undefined) {
      // Remove existing tags
      await db.taskTag.deleteMany({
        where: { taskId: resolvedParams.id }
      })
      
      // Add new tags
      if (tags.length > 0) {
        await Promise.all(
          tags.map(async (tagId: string) => {
            await db.taskTag.create({
              data: {
                taskId: resolvedParams.id,
                tagId: tagId
              }
            })
          })
        )
      }
    }
    
    // Create notifications for various changes
    const notificationPromises: Promise<any>[] = []
    
    // 1. Status change notifications
    if (status !== undefined && status !== existingTask.status) {
      // Special notification for task completion
      if (status === "DONE" && existingTask.status !== "DONE") {
        // Notify creator if they're not the one who completed it
        if (existingTask.creatorId !== session.user.id) {
          notificationPromises.push(
            db.notification.create({
              data: {
                title: "Task Completed",
                message: `"${task.title}" has been marked as complete`,
                type: "TASK_COMPLETED",
                userId: existingTask.creatorId
              }
            })
          )
        }
        
        // Notify assignees if they're not the one who completed it
        if (existingTask.assignees && existingTask.assignees.length > 0) {
          for (const assignee of existingTask.assignees) {
            if (assignee.userId !== session.user.id) {
              notificationPromises.push(
                db.notification.create({
                  data: {
                    title: "Task Completed",
                    message: `"${task.title}" has been marked as complete`,
                    type: "TASK_COMPLETED",
                    userId: assignee.userId
                  }
                })
              )
            }
          }
        }
      } else {
        // Regular status change notification
        // Notify assignees if status changed
        if (task.assignees && task.assignees.length > 0) {
          for (const assignee of task.assignees) {
            if (assignee.user.id !== session.user.id) {
              notificationPromises.push(
                db.notification.create({
                  data: {
                    title: "Task Status Updated",
                    message: `"${task.title}" status changed to ${status}`,
                    type: "TASK_UPDATED",
                    userId: assignee.user.id
                  }
                })
              )
            }
          }
        }
        
        if (existingTask.creatorId !== session.user.id && existingTask.creatorId !== task.assignees?.some(a => a.user.id === existingTask.creatorId)) {
          notificationPromises.push(
            db.notification.create({
              data: {
                title: "Task Status Updated",
                message: `"${task.title}" status changed to ${status}`,
                type: "TASK_UPDATED",
                userId: existingTask.creatorId
              }
            })
          )
        }
      }
    }
    
    // 2. Assignment change notifications
    if (assigneeIds !== undefined) {
      // Get the new assignees
      const newAssignees = assigneeIds.map((id: string) => ({ id }))
      
      // Notify new assignees
      for (const assignee of newAssignees) {
        if (assignee.id !== session.user.id) {
          notificationPromises.push(
            db.notification.create({
              data: {
                title: "Task Assigned",
                message: `You have been assigned to "${task.title}"`,
                type: "TASK_ASSIGNED",
                userId: assignee.id
              }
            })
          )
        }
      }
      
      // Notify previous assignees if they're being removed
      if (existingTask.assignees && existingTask.assignees.length > 0) {
        for (const assignee of existingTask.assignees) {
          if (!assigneeIds.includes(assignee.userId) && assignee.userId !== session.user.id) {
            notificationPromises.push(
              db.notification.create({
                data: {
                  title: "Task Unassigned",
                  message: `You have been unassigned from "${task.title}"`,
                  type: "TASK_UPDATED",
                  userId: assignee.userId
                }
              })
            )
          }
        }
      }
    }
    
    // Execute all notification creation promises
    await Promise.all(notificationPromises)
    
    // Fetch the task again with assignees included
    const taskWithAssignees = await db.task.findUnique({
      where: { id: resolvedParams.id },
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
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      }
    })
    
    return NextResponse.json(taskWithAssignees)
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const resolvedParams = await params
    
    // Check if task exists and user has permission to delete it
    const existingTask = await db.task.findUnique({
      where: { id: resolvedParams.id },
      include: {
        creator: {
          select: { id: true }
        },
        assignees: {
          include: {
            user: { select: { id: true } }
          }
        }
      }
    })
    
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    
    // Check if user has permission to delete this task
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const canDelete = 
      user.role === "ADMIN" || 
      user.role === "MANAGER" || 
      existingTask.creatorId === session.user.id
    
    if (!canDelete) {
      return NextResponse.json({ error: "You don't have permission to delete this task" }, { status: 403 })
    }
    
    // Notify relevant people about task deletion
    const notifyIds = new Set<string>()
    // Notify creator if they're not the one who deleted it
    if (existingTask.creatorId !== session.user.id) {
      notifyIds.add(existingTask.creatorId)
    }
    // Notify assignees if they're not the one who deleted it and not the creator
    if (existingTask.assignees && existingTask.assignees.length > 0) {
      for (const assignee of existingTask.assignees) {
        if (assignee.userId !== session.user.id && assignee.userId !== existingTask.creatorId) {
          notifyIds.add(assignee.userId)
        }
      }
    }
    
    // Create notifications
    for (const userId of notifyIds) {
      await db.notification.create({
        data: {
          title: "Task Deleted",
          message: `"${existingTask.title}" has been deleted`,
          type: "TASK_UPDATED",
          userId
        }
      })
    }
    
    // Delete the task (cascade will handle related records)
    await db.task.delete({
      where: { id: resolvedParams.id }
    })
    
    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}