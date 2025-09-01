// lib/meeting-reminders.ts (updated)

import { db } from "./db"
import { sendMeetingReminderEmail } from "./email"

export async function checkUpcomingMeetings() {
  try {
    // Get all meetings scheduled for the next 24 hours
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const upcomingMeetings = await db.teamMeeting.findMany({
      where: {
        startTime: {
          gte: now,
          lt: tomorrow
        }
      },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })
    
    // For each meeting, check if we need to send reminders
    for (const meeting of upcomingMeetings) {
      // Calculate time until meeting
      const timeUntilMeeting = meeting.startTime.getTime() - now.getTime()
      
      // Send reminder if meeting is in 1 hour
      if (timeUntilMeeting > 0 && timeUntilMeeting <= 60 * 60 * 1000) {
        // Send notifications to all team members
        for (const member of meeting.team.members) {
          // Check if we already sent a reminder for this meeting
          const existingNotification = await db.notification.findFirst({
            where: {
              userId: member.userId,
              title: {
                contains: meeting.title
              },
              type: "SYSTEM",
              createdAt: {
                gte: new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago
              }
            }
          })
          
          if (!existingNotification) {
            // Create notification
            await db.notification.create({
              data: {
                title: "Meeting Reminder",
                message: `Meeting "${meeting.title}" starts in 1 hour`,
                type: "SYSTEM",
                userId: member.userId
              }
            })
            
            // Send email reminder
            await sendMeetingReminderEmail({
              to: member.user.email,
              teamName: meeting.team.name,
              meetingTitle: meeting.title,
              startTime: meeting.startTime,
              meetLink: meeting.meetLink || undefined
            })
          }
        }
      }
    }
  } catch (error) {
    console.error("Error checking upcoming meetings:", error)
  }
}