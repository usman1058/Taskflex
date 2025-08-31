// lib/notifications.ts
import { db } from "@/lib/db"

export async function createNotification({
  userId,
  title,
  message,
  type
}: {
  userId: string
  title: string
  message: string
  type: "TASK_ASSIGNED" | "TASK_UPDATED" | "TASK_COMPLETED" | "COMMENT_ADDED" | "MENTION" | "TEAM_INVITATION" | "SYSTEM"
}) {
  try {
    await db.notification.create({
      data: {
        userId,
        title,
        message,
        type
      }
    })
    return { success: true }
  } catch (error) {
    console.error("Error creating notification:", error)
    return { success: false, error }
  }
}