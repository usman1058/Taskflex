// app/api/teams/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if user is a member of the team
    const team = await db.team.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        projects: {
          select: {
            id: true,
            name: true,
            key: true,
            status: true,
            _count: {
              select: {
                tasks: true
              }
            }
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            dueDate: true,
            priority: true,
            type: true,
            createdAt: true,
            updatedAt: true,
            projectId: true,
            teamId: true,
            creatorId: true,
            assignees: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            projects: true
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if user is a member of the team or has admin role
    const isMember = team.members.some(member => member.userId === session.user.id)
    const isOwner = team.owner.id === session.user.id
    const isAdmin = session.user.role === "ADMIN"

    if (!isMember && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error("Error fetching team:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

  export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const session = await getServerSession(authOptions)

      if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { id } = await params

      const body = await request.json()
      const { name, description, status } = body

      if (!name) {
        return NextResponse.json(
          { error: "Team name is required" },
          { status: 400 }
        )
      }

      const updatedTeam = await db.team.update({
        where: { id },
        data: {
          name,
          description,
          status
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
          organization: {
            select: { id: true, name: true }
          },
          projects: {
            select: {
              id: true,
              name: true,
              key: true,
              status: true,
              _count: {
                select: {
                  tasks: true
                }
              }
            }
          },
          tasks: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              dueDate: true,
              assigneeId: true
            }
          },
          _count: {
            select: {
              members: true,
              projects: true
            }
          }
        }
      })

      return NextResponse.json(updatedTeam)
    } catch (error) {
      console.error("Error updating team:", error)
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    }
  }

  export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const session = await getServerSession(authOptions)

      if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { id } = await params

      await db.team.delete({
        where: { id }
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Error deleting team:", error)
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    }
  }