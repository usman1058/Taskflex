// lib/team-invitations.ts
import { db } from "./db"

export async function getTeamInvitationDetails(notificationId: string, userId: string) {
  try {
    // Find the team membership for this invitation
    const teamMembership = await db.teamMembership.findFirst({
      where: {
        userId,
        status: "PENDING"
      },
      include: {
        team: {
          select: { name: true }
        }
      }
    })

    if (!teamMembership) {
      return null
    }

    // Fetch inviter details
    let inviterName = "Unknown"
    if (teamMembership.invitedBy) {
      const inviter = await db.user.findUnique({
        where: { id: teamMembership.invitedBy },
        select: { name: true, email: true }
      })
      
      if (inviter) {
        inviterName = inviter.name || inviter.email
      }
    }

    return {
      teamId: teamMembership.teamId,
      teamName: teamMembership.team.name,
      token: teamMembership.token,
      inviterName
    }
  } catch (error) {
    console.error("Error fetching team invitation details:", error)
    return null
  }
}