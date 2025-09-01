// app/api/settings/route.ts
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
    
    // Get user settings
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        status: true
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Get user notification preferences (if you have a notification preferences table)
    // For now, we'll return default preferences
    const notificationPreferences = {
      emailNotifications: true,
      taskAssigned: true,
      taskUpdated: true,
      taskCompleted: false,
      commentAdded: true,
      mention: true,
      teamInvitation: true,
      system: true
    }
    
    // Get user display preferences
    const displayPreferences = {
      theme: "system",
      density: "comfortable",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h"
    }
    
    return NextResponse.json({
      user,
      notificationPreferences,
      displayPreferences
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
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
    const { 
      name, 
      email, 
      notificationPreferences, 
      displayPreferences 
    } = body
    
    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email })
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        status: true
      }
    })
    
    // In a real implementation, you would save notification and display preferences
    // to separate tables in your database
    
    return NextResponse.json({
      user: updatedUser,
      notificationPreferences,
      displayPreferences
    })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}