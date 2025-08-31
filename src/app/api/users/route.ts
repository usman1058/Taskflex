// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      console.log("No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user is a manager or admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (!user) {
      console.log("User not found in database")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (user.role !== "MANAGER" && user.role !== "ADMIN") {
      console.log(`User role ${user.role} is not authorized`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const role = searchParams.get("role")
    const status = searchParams.get("status")
    
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    }
    
    if (role && role !== "ALL") {
      where.role = role
    }
    
    if (status && status !== "ALL") {
      where.status = status
    }
    
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true,
            assignedTasks: true,
            comments: true
          }
        }
      },
      orderBy: { name: "asc" }
    })
    
    console.log(`Found ${users.length} users`)
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user is a manager or admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (!user || (user.role !== "MANAGER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { name, email, role } = body
    
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 }
      )
    }
    
    // Check if user with this email already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }
    
    // Create new user
    const newUser = await db.user.create({
      data: {
        name,
        email,
        role,
        status: "ACTIVE"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    })
    
    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}