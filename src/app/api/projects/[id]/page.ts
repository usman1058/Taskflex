// app/api/projects/[id]/route.ts
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
    
    const project = await db.project.findUnique({
      where: { id: params.id },
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
    
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { name, description, status } = body
    
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }
    
    // Check if project exists
    const existingProject = await db.project.findUnique({
      where: { id: params.id }
    })
    
    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    
    const project = await db.project.update({
      where: { id: params.id },
      data: {
        name,
        description,
        status
      },
      include: {
        members: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })
    
    return NextResponse.json(project)
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}