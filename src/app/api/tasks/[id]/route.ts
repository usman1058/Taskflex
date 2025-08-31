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
    const task = await db.task.findUnique({
      where: { id: resolvedParams.id },
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
            user: {
              select: { id: true, name: true, email: true }
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
      assigneeId,
      projectId,
      tags
    } = body
    
    // Check if task exists
    const existingTask = await db.task.findUnique({
      where: { id: resolvedParams.id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true, members: { select: { id: true } } }
        },
        watchers: {
          include: {
            user: { select: { id: true } }
          }
        }
      }
    })
    
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    
    // Update the task
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId
    if (projectId !== undefined) updateData.projectId = projectId
    
    const task = await db.task.update({
      where: { id: resolvedParams.id },
      data: updateData,
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
    
    // Update tags if provided
    if (tags !== undefined) {
      // Remove existing tags
      await db.taskTag.deleteMany({
        where: { taskId: resolvedParams.id }
      })
      
      // Add new tags
      if (tags.length > 0) {
        await Promise.all(
          tags.map(async (tagInput: string | { id: string, name: string }) => {
            let tagId: string;
            
            if (typeof tagInput === 'string') {
              // If it's a string, it could be a tag name or ID
              // Try to find existing tag by name first
              const existingTag = await db.tag.findUnique({
                where: { name: tagInput }
              });
              
              if (existingTag) {
                tagId = existingTag.id;
              } else {
                // Create new tag if it doesn't exist
                const newTag = await db.tag.create({
                  data: { name: tagInput, color: "#6366f1" }
                });
                tagId = newTag.id;
              }
            } else {
              // If it's an object, use the ID
              tagId = tagInput.id;
            }
            
            await db.taskTag.create({
              data: {
                taskId: resolvedParams.id,
                tagId: tagId
              }
            });
          })
        );
      }
    }
    
    // Create notifications for various changes
    
    // 1. Status change notifications
    if (status !== undefined && status !== existingTask.status) {
      // Special notification for task completion
      if (status === "DONE" && existingTask.status !== "DONE") {
        // Notify creator if they're not the one who completed it
        if (existingTask.creatorId !== session.user.id) {
          await db.notification.create({
            data: {
              title: "Task Completed",
              message: `"${task.title}" has been marked as complete`,
              type: "TASK_COMPLETED",
              userId: existingTask.creatorId
            }
          })
        }
        
        // Notify assignee if they're not the one who completed it
        if (existingTask.assigneeId && existingTask.assigneeId !== session.user.id) {
          await db.notification.create({
            data: {
              title: "Task Completed",
              message: `"${task.title}" has been marked as complete`,
              type: "TASK_COMPLETED",
              userId: existingTask.assigneeId
            }
          })
        }
      } else {
        // Regular status change notification
        // Notify assignee if status changed
        if (task.assigneeId && task.assigneeId !== session.user.id) {
          await db.notification.create({
            data: {
              title: "Task Status Updated",
              message: `"${task.title}" status changed to ${status}`,
              type: "TASK_UPDATED",
              userId: task.assigneeId
            }
          })
        }
        
        // Notify creator if they're not the one who changed it and not the assignee
        if (existingTask.creatorId !== session.user.id && existingTask.creatorId !== task.assigneeId) {
          await db.notification.create({
            data: {
              title: "Task Status Updated",
              message: `"${task.title}" status changed to ${status}`,
              type: "TASK_UPDATED",
              userId: existingTask.creatorId
            }
          })
        }
      }
    }
    
    // 2. Assignment change notifications
    if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId) {
      // Notify the new assignee
      if (assigneeId && assigneeId !== session.user.id) {
        await db.notification.create({
          data: {
            title: "Task Assigned",
            message: `You have been assigned to "${task.title}"`,
            type: "TASK_ASSIGNED",
            userId: assigneeId
          }
        })
      }
      
      // Notify the previous assignee if they're being removed
      if (existingTask.assigneeId && existingTask.assigneeId !== session.user.id) {
        await db.notification.create({
          data: {
            title: "Task Unassigned",
            message: `You have been unassigned from "${task.title}"`,
            type: "TASK_UPDATED",
            userId: existingTask.assigneeId
          }
        })
      }
    }
    
    // 3. Notify watchers about important changes
    if (status !== undefined || assigneeId !== undefined) {
      const watcherIds = existingTask.watchers
        .filter(watcher => watcher.user.id !== session.user.id)
        .map(watcher => watcher.user.id)
      
      // Remove assignee and creator from watchers if they're already being notified
      const notifyWatcherIds = watcherIds.filter(id => 
        id !== task.assigneeId && id !== existingTask.creatorId
      )
      
      for (const watcherId of notifyWatcherIds) {
        await db.notification.create({
          data: {
            title: "Task Updated",
            message: `"${task.title}" has been updated`,
            type: "TASK_UPDATED",
            userId: watcherId
          }
        })
      }
    }
    
    // 4. Project change notification
    if (projectId !== undefined && projectId !== existingTask.projectId) {
      // If moved to a new project, notify project members
      if (projectId) {
        const project = await db.project.findUnique({
          where: { id: projectId },
          include: {
            members: {
              select: { id: true }
            }
          }
        })
        
        if (project) {
          for (const member of project.members) {
            // Don't notify the person who made the change
            if (member.id !== session.user.id) {
              await db.notification.create({
                data: {
                  title: "Task Added to Project",
                  message: `"${task.title}" has been added to the project "${project.name}"`,
                  type: "TASK_UPDATED",
                  userId: member.id
                }
              })
            }
          }
        }
      }
    }
    
    return NextResponse.json(task)
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
    
    // Check if task exists and get details for notifications
    const existingTask = await db.task.findUnique({
      where: { id: resolvedParams.id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        },
        watchers: {
          include: {
            user: { select: { id: true } }
          }
        }
      }
    })
    
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    
    // Notify relevant people about task deletion
    const notifyIds = new Set<string>()
    
    // Notify creator if they're not the one who deleted it
    if (existingTask.creatorId !== session.user.id) {
      notifyIds.add(existingTask.creatorId)
    }
    
    // Notify assignee if they're not the one who deleted it and not the creator
    if (existingTask.assigneeId && 
        existingTask.assigneeId !== session.user.id && 
        existingTask.assigneeId !== existingTask.creatorId) {
      notifyIds.add(existingTask.assigneeId)
    }
    
    // Notify watchers
    existingTask.watchers.forEach(watcher => {
      if (watcher.user.id !== session.user.id) {
        notifyIds.add(watcher.user.id)
      }
    })
    
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