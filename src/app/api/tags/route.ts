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
    const search = searchParams.get("search")

    const where: any = {}
    
    if (search) {
      where.name = { contains: search, mode: "insensitive" }
    }

    const tags = await db.tag.findMany({
      where,
      include: {
        _count: {
          select: {
            taskTags: true
          }
        }
      },
      orderBy: { name: "asc" }
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error("Error fetching tags:", error)
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
    const { name, color } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Check if tag already exists
    const existingTag = await db.tag.findUnique({
      where: { name }
    })

    if (existingTag) {
      return NextResponse.json(
        { error: "Tag already exists" },
        { status: 400 }
      )
    }

    const tag = await db.tag.create({
      data: {
        name,
        color: color || "#6366f1"
      }
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error("Error creating tag:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}