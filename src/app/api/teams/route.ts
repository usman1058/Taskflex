// app/api/teams/route.ts
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
    
    // Get teams where user is a member or owner
    const teams = await db.team.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        _count: {
          select: {
            members: true,
            projects: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    
    return NextResponse.json(teams)
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { name, description, organizationId, memberIds = [] } = body
    
    if (!name) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      )
    }
    
    // Create the team
    const team = await db.team.create({
      data: {
        name,
        description,
        organizationId,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
            status: "ACTIVE"
          }
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      }
    })
    
    // Add additional members if provided
    if (memberIds.length > 0) {
      const memberData = memberIds.map((userId: string) => ({
        userId,
        teamId: team.id,
        role: "MEMBER",
        status: "ACTIVE"
      }))
      
      await db.teamMembership.createMany({
        data: memberData
      })
      
      // Create notifications for all new members
      for (const userId of memberIds) {
        await db.notification.create({
          data: {
            title: "Added to Team",
            message: `You have been added to the team "${name}"`,
            type: "TEAM_INVITATION",
            userId
          }
        })
      }
    }
    
    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error("Error creating team:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}