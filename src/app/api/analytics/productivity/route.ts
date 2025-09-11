import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { startOfWeek, endOfWeek, subWeeks, format, eachDayOfInterval, isSameDay } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const weeks = parseInt(searchParams.get("weeks") || "4")
    const organizationId = searchParams.get("organizationId")
    
    // Build the base where clause
    const baseWhere: any = {
      status: "DONE",
      OR: [
        { assignees: { some: { userId: session.user.id } } },
        { creatorId: session.user.id }
      ]
    }
    
    // Add organization filter if provided
    if (organizationId && organizationId !== "ALL") {
      baseWhere.project = {
        organizationId: organizationId
      }
    }
    
    // Get tasks completed per day for the last N weeks
    const now = new Date()
    const startOfCurrentWeek = startOfWeek(now)
    const endOfCurrentWeek = endOfWeek(now)
    
    const weeksData = []
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i))
      const weekEnd = endOfWeek(subWeeks(now, i))
      
      const daysInWeek = eachDayOfInterval({
        start: weekStart,
        end: weekEnd
      })
      
      const dailyCompletions = await Promise.all(
        daysInWeek.map(async (day) => {
          const completedTasks = await db.task.count({
            where: {
              ...baseWhere,
              updatedAt: {
                gte: day,
                lt: new Date(day.getTime() + 24 * 60 * 60 * 1000) // Next day
              }
            }
          })
          
          return {
            day: format(day, "EEE"),
            date: format(day, "yyyy-MM-dd"),
            completedTasks
          }
        })
      )
      
      const weekTotal = dailyCompletions.reduce((sum, day) => sum + day.completedTasks, 0)
      
      weeksData.push({
        week: `Week ${weeks - i}`,
        weekStart: format(weekStart, "MMM dd"),
        weekEnd: format(weekEnd, "MMM dd"),
        dailyCompletions,
        weekTotal
      })
    }
    
    // Get average time to complete tasks
    const completedTasks = await db.task.findMany({
      where: baseWhere,
      select: {
        createdAt: true,
        updatedAt: true
      }
    })
    
    const completionTimes = completedTasks.map(task => {
      const created = new Date(task.createdAt).getTime()
      const completed = new Date(task.updatedAt).getTime()
      return (completed - created) / (1000 * 60 * 60 * 24) // Convert to days
    })
    
    const avgCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0
    
    // Get current streak of completed tasks
    const sortedTasks = await db.task.findMany({
      where: baseWhere,
      orderBy: {
        updatedAt: "desc"
      },
      select: {
        updatedAt: true
      }
    })
    
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    
    for (const task of sortedTasks) {
      const taskDate = new Date(task.updatedAt)
      taskDate.setHours(0, 0, 0, 0)
      
      const diffDays = Math.floor((currentDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === streak) {
        streak++
      } else {
        break
      }
    }
    
    return NextResponse.json({
      weeklyProductivity: weeksData,
      avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      currentStreak: streak,
      totalCompleted: completedTasks.length
    })
  } catch (error) {
    console.error("Error fetching productivity analytics:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}