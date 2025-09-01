// app/api/projects/[id]/members/route.ts
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
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const project = await db.project.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatar: true }
                }
              }
            }
          }
        }
      }
    })
    
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    
    // Check if user has access to this project
    const hasAccess = project.members.length > 0 || 
                      (project.team && project.team.members.length > 0) ||
                      session.user.role === "ADMIN" ||
                      session.user.role === "MANAGER"
    
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    // Combine direct project members and team members
    const allMembers = [
      ...project.members,
      ...(project.team?.members || [])
    ]
    
    // Remove duplicates (in case user is both a direct member and team member)
    const uniqueMembers = allMembers.filter((member, index, self) =>
      index === self.findIndex(m => m.userId === member.userId)
    )
    
    return NextResponse.json(uniqueMembers)
  } catch (error) {
    console.error("Error fetching project members:", error)
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
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { userId, role = "MEMBER" } = body
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }
    
    // Check if user has permission to add members
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: params.id }
    })
    
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    
    // Check if user is already a member
    const existingMember = await db.project.findUnique({
      where: {
        id: params.id,
        members: {
          some: { userId }
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
      where: { id: params.id },
      data: {
        members: {
          connect: { id: userId }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      }
    })
    
    // Create notification
    await db.notification.create({
      data: {
        title: "Added to Project",
        message: `You have been added to project "${project.name}"`,
        type: "SYSTEM",
        userId
      }
    })
    
    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error adding project member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}