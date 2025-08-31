// app/api/notifications/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if the notification exists and belongs to the current user
    const notification = await db.notification.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })
    
    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }
    
    // Delete the notification
    await db.notification.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: "Notification deleted successfully" })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}