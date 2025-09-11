// app/api/projects/route.ts
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
    
    // Get user role to determine permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Build where clause based on user role and search parameters
    const whereClause: any = {}
    
    // Add search conditions if provided
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { key: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    }
    
    // Add status filter if provided
    if (status && status !== "ALL") {
      whereClause.status = status
    }
    
    // Add permission-based filtering
    if (user.role !== "ADMIN" && user.role !== "MANAGER") {
      console.log(`User ${session.user.id} with role ${user.role} is requesting projects. Applying member filter.`)
      
      // For regular users, only show projects they're members of
      if (whereClause.OR) {
        // If there are already OR conditions (from search), we need to add the member filter
        // We'll use AND with the existing OR conditions
        whereClause.AND = [
          {
            members: {
              some: {
                id: session.user.id
              }
            }
          }
        ]
      } else {
        // If no OR conditions, just add the member filter directly
        whereClause.members = {
          some: {
            id: session.user.id
          }
        }
      }
    } else {
      console.log(`User ${session.user.id} with role ${user.role} can see all projects.`)
    }
    
    console.log("Final where clause:", JSON.stringify(whereClause, null, 2))
    
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
    
    console.log(`Found ${projects.length} projects for user ${session.user.id}`)
    
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
    
    // Create the project with the current user as a member
    const project = await db.project.create({
      data: {
        name,
        description,
        key,
        members: {
          connect: [{ id: session.user.id }, ...memberIds.map((id: string) => ({ id }))]
        }
      },
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
      }
    })
    
    // Create notifications for all new members (excluding the creator)
    for (const memberId of memberIds) {
      if (memberId !== session.user.id) {
        await db.notification.create({
          data: {
            title: "Added to Project",
            message: `You have been added to the project "${name}"`,
            type: "SYSTEM",
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