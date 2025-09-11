import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { join } from "path"
import { readFile } from "fs/promises"
import { existsSync } from "fs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const resolvedParams = await params
    const attachmentId = resolvedParams.id
    
    // Find the attachment in the database
    const attachment = await db.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        task: {
          select: {
            creatorId: true,
            assignees: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    })
    
    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
    }
    
    // Check if user has permission to access this attachment
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const canAccess = 
      user.role === "ADMIN" || 
      user.role === "MANAGER" || 
      attachment.task.creatorId === session.user.id ||
      attachment.task.assignees.some(assignee => assignee.userId === session.user.id)
    
    if (!canAccess) {
      return NextResponse.json({ error: "You don't have permission to access this attachment" }, { status: 403 })
    }
    
    // Get the file path
    const filePath = join(process.cwd(), "public", "uploads", attachment.path)
    
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found on server" }, { status: 404 })
    }
    
    // Read the file
    const fileBuffer = await readFile(filePath)
    
    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${attachment.filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("Error downloading attachment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}