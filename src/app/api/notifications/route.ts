// app/api/notifications/route.ts (updated GET method)
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTeamInvitationDetails } from "@/lib/team-invitations"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit
    
    const notifications = await db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })
    
    // Enhance notifications with team invitation details
    const enhancedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        const enhancedNotification: any = { ...notification }
        
        // If it's a team invitation, fetch additional details
        if (notification.type === "TEAM_INVITATION") {
          const invitationDetails = await getTeamInvitationDetails(notification.id, session.user.id)
          
          if (invitationDetails) {
            enhancedNotification.teamId = invitationDetails.teamId
            enhancedNotification.teamName = invitationDetails.teamName
            enhancedNotification.token = invitationDetails.token
            enhancedNotification.inviterName = invitationDetails.inviterName
          }
        }
        
        return enhancedNotification
      })
    )
    
    const totalCount = await db.notification.count({
      where: { userId: session.user.id }
    })
    
    return NextResponse.json(enhancedNotifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { notificationIds, read } = body
    
    await db.notification.updateMany({
      where: {
        id: {
          in: notificationIds
        },
        userId: session.user.id
      },
      data: {
        read
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}