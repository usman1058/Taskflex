// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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
          const teamMembership = await db.teamMembership.findFirst({
            where: {
              userId: session.user.id,
              status: "PENDING"
            },
            include: {
              team: {
                select: { name: true }
              },
              invitedByUser: {
                select: { name: true, email: true }
              }
            }
          })
          
          if (teamMembership) {
            enhancedNotification.teamId = teamMembership.teamId
            enhancedNotification.teamName = teamMembership.team.name
            enhancedNotification.inviterName = teamMembership.invitedByUser?.name || teamMembership.invitedByUser?.email
            enhancedNotification.token = teamMembership.token
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