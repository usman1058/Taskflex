// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    
    if (!query.trim()) {
      return NextResponse.json({
        tasks: [],
        projects: [],
        users: []
      })
    }
    
    // Get projects where user is a member
    const userProjects = await db.project.findMany({
      where: {
        members: {
          some: { id: session.user.id }
        }
      },
      select: { id: true }
    })
    
    const projectIds = userProjects.map(p => p.id)
    
    // Search tasks
    const tasks = await db.task.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } }
            ]
          },
          {
            OR: [
              { projectId: { in: projectIds } },
              { assigneeId: session.user.id },
              { creatorId: session.user.id }
            ]
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
      orderBy: { createdAt: "desc" },
      take: 10
    })
    
    // Search projects
    const projects = await db.project.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { key: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } }
            ]
          },
          {
            members: {
              some: { id: session.user.id }
            }
          }
        ]
      },
      include: {
        _count: {
          select: {
            tasks: true,
            members: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })
    
    // Search users
    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        _count: {
          select: {
            tasks: true,
            assignedTasks: true
          }
        }
      },
      orderBy: { name: "asc" },
      take: 10
    })
    
    return NextResponse.json({
      tasks,
      projects,
      users
    })
  } catch (error) {
    console.error("Error searching:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}