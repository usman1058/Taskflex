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
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    
    const whereClause: any = {}
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { key: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    }
    
    if (status && status !== "ALL") {
      whereClause.status = status
    }
    
    const projects = await db.project.findMany({
      where: whereClause,
      include: {
        members: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        _count: {
          select: {
            tasks: true,
            members: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    
    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
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
    const { name, description, key, memberIds = [] } = body
    
    if (!name || !key) {
      return NextResponse.json(
        { error: "Name and key are required" },
        { status: 400 }
      )
    }
    
    // Check if project key already exists
    const existingProject = await db.project.findUnique({
      where: { key }
    })
    
    if (existingProject) {
      return NextResponse.json(
        { error: "Project key already exists" },
        { status: 400 }
      )
    }
    
    // Create the project
    const project = await db.project.create({
      data: {
        name,
        description,
        key,
        members: {
          connect: [{ id: session.user.id }]
        }
      },
      include: {
        members: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })
    
    // Add additional members if provided
    if (memberIds.length > 0) {
      await db.project.update({
        where: { id: project.id },
        data: {
          members: {
            connect: memberIds.map((id: string) => ({ id }))
          }
        }
      })
      
      // Create notifications for all new members
      for (const memberId of memberIds) {
        await db.notification.create({
          data: {
            title: "Added to Project",
            message: `You have been added to the project "${name}"`,
            type: "PROJECT_INVITE",
            userId: memberId
          }
        })
      }
    }
    
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}