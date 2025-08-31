// app/api/users/profile/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      console.log("No session found in profile API")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    if (!user) {
      console.log("User not found in database")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    console.log(`Found user profile for ${user.email} with role ${user.role}`)
    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}