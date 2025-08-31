import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const comments = await db.comment.findMany({
      where: { taskId: params.id },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      orderBy: { createdAt: "asc" }
    })
    
    return NextResponse.json(comments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { content } = body
    
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }
    
    // Check if task exists and get details for notifications
    const task = await db.task.findUnique({
      where: { id: params.id },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        },
        creator: {
          select: { id: true, name: true, email: true }
        },
        watchers: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        comments: {
          select: { authorId: true }
        }
      }
    })
    
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    
    const comment = await db.comment.create({
      data: {
        content,
        taskId: params.id,
        authorId: session.user.id
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })
    
    // Collect all user IDs to notify
    const notifyIds = new Set<string>()
    
    // Notify task assignee if they're not the commenter
    if (task.assigneeId && task.assigneeId !== session.user.id) {
      notifyIds.add(task.assigneeId)
    }
    
    // Notify task creator if they're not the commenter and not the assignee
    if (task.creatorId !== session.user.id && task.creatorId !== task.assigneeId) {
      notifyIds.add(task.creatorId)
    }
    
    // Notify watchers who aren't the commenter
    task.watchers.forEach(watcher => {
      if (watcher.user.id !== session.user.id) {
        notifyIds.add(watcher.user.id)
      }
    })
    
    // Notify other commenters who aren't the commenter, assignee, or creator
    task.comments.forEach(comment => {
      if (comment.authorId !== session.user.id && 
          comment.authorId !== task.assigneeId && 
          comment.authorId !== task.creatorId) {
        notifyIds.add(comment.authorId)
      }
    })
    
    // Check for mentions in the comment content
    const mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi
    const mentions = content.match(mentionRegex)
    
    if (mentions) {
      for (const mention of mentions) {
        const email = mention.substring(1) // Remove the @
        const mentionedUser = await db.user.findUnique({
          where: { email }
        })
        
        if (mentionedUser && mentionedUser.id !== session.user.id) {
          // Add mention notification
          await db.notification.create({
            data: {
              title: "You Were Mentioned",
              message: `You were mentioned in a comment on "${task.title}"`,
              type: "MENTION",
              userId: mentionedUser.id
            }
          })
          
          // Remove from general notification set since they're getting a specific mention notification
          notifyIds.delete(mentionedUser.id)
        }
      }
    }
    
    // Create general comment notifications for remaining users
    for (const userId of notifyIds) {
      await db.notification.create({
        data: {
          title: "New Comment",
          message: `New comment on "${task.title}"`,
          type: "COMMENT_ADDED",
          userId
        }
      })
    }
    
    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}