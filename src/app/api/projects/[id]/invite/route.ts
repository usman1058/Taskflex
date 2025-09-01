// app/api/projects/[id]/invite/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
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
    const { email } = body
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }
    
    // Check if project exists
    const project = await db.project.findUnique({
      where: { id }
    })
    
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    
    // Find user by email
    const user = await db.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: "User with this email not found" },
        { status: 404 }
      )
    }
    
    // Check if user is already a member
    const existingMember = await db.project.findUnique({
      where: {
        id,
        members: {
          some: { id: user.id }
        }
      }
    })
    
    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a project member" },
        { status: 400 }
      )
    }
    
    // Add user to project
    const updatedProject = await db.project.update({
      where: { id },
      data: {
        members: {
          connect: { id: user.id }
        }
      },
      include: {
        members: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })
    
    // Create notification using SYSTEM type (valid according to Prisma schema)
    await db.notification.create({
      data: {
        title: "Added to Project",
        message: `You have been added to the project "${project.name}"`,
        type: "SYSTEM", // Changed from PROJECT_INVITE to SYSTEM
        userId: user.id
      }
    })
    
    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error inviting member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}