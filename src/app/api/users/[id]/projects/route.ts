// app/api/users/[id]/projects/route.ts
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
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Unwrap params Promise
    const { id } = await params
    
    // Check if user exists
    const user = await db.user.findUnique({
      where: { id }
    })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Get projects where user is a member
    const projects = await db.project.findMany({
      where: {
        members: {
          some: { id: user.id }
        }
      },
      select: {
        id: true,
        name: true,
        key: true,
        status: true
      },
      orderBy: { createdAt: "desc" }
    })
    
    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching user projects:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}