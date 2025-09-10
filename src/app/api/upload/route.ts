import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const data = await request.formData()
    const file: File | null = data.get("file") as unknown as File
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Generate a unique filename
    const fileExtension = path.extname(file.name)
    const filename = `${uuidv4()}${fileExtension}`
    
    // Define the upload directory
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    
    // Create the upload directory if it doesn't exist
    const fs = require("fs")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    // Write the file to the upload directory
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)
    
    // Return the file information
    return NextResponse.json({
      id: uuidv4(),
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type,
      path: `/uploads/${filename}`
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}