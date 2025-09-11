// app/api/projects/[id]/route.ts
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
    
    const project = await db.project.findUnique({
      where: { id },
      include: {
        members: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            avatar: true 
          }
        },
        organization: {
          select: { 
            id: true, 
            name: true,
            description: true
          }
        },
        team: {
          select: { 
            id: true, 
            name: true,
            description: true
          }
        },
        _count: {
          select: {
            tasks: true,
            members: true
          }
        }
      }
    })
    
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    
    // Check if user has access to this project
    const hasAccess = project.members.some(member => member.id === session.user.id) ||
                     session.user.role === "ADMIN" ||
                     session.user.role === "MANAGER"
    
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project:", error)
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
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Unwrap params Promise
    const { id } = await params
    
    const body = await request.json()
    const { name, description, key, status, memberIds = [] } = body
    
    if (!name || !key) {
      return NextResponse.json(
        { error: "Name and key are required" },
        { status: 400 }
      )
    }
    
    // Check if project key already exists (excluding current project)
    const existingProject = await db.project.findFirst({
      where: { 
        key,
        NOT: { id }
      }
    })
    
    if (existingProject) {
      return NextResponse.json(
        { error: "Project key already exists" },
        { status: 400 }
      )
    }
    
    // Update the project
    const updatedProject = await db.project.update({
      where: { id },
      data: {
        name,
        description,
        key,
        status,
        members: {
          set: memberIds.map((id: string) => ({ id }))
        }
      },
      include: {
        members: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            avatar: true 
          }
        }
      }
    })
    
    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error updating project:", error)
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
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Unwrap params Promise
    const { id } = await params
    
    await db.project.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}