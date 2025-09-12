// app/api/users/avatar/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeFile } from "fs/promises"
import { join } from "path"
import { mkdir } from "fs/promises"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const data = await request.formData()
    const file: File | null = data.get("avatar") as unknown as File
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars")
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      console.log("Upload directory already exists")
    }
    
    // Generate unique filename
    const fileName = `${session.user.id}-${Date.now()}-${file.name}`
    const path = join(uploadDir, fileName)
    
    // Save file
    await writeFile(path, buffer)
    
    // Update user avatar in database
    const avatarUrl = `/uploads/avatars/${fileName}`
    await db.user.update({
      where: { id: session.user.id },
      data: { avatar: avatarUrl }
    })
    
    return NextResponse.json({ avatarUrl })
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}