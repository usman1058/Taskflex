// app/api/projects/[id]/tasks/route.ts
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
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        
        // Unwrap params Promise
        const { id } = await params
        
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "10")
        const status = searchParams.get("status")
        const priority = searchParams.get("priority")
        const search = searchParams.get("search")
        const skip = (page - 1) * limit
        
        // Check if user has access to this project
        const project = await db.project.findUnique({
            where: { id },
            include: {
                members: true,
                team: {
                    include: {
                        members: true
                    }
                }
            }
        })
        
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }
        
        // Check if user is a member of the project or team
        const isProjectMember = project.members.some(member => member.id === session.user.id)
        const isTeamMember = project.team?.members.some(member => member.userId === session.user.id)
        const hasAccess = isProjectMember ||
            isTeamMember ||
            session.user.role === "ADMIN" ||
            session.user.role === "MANAGER"
        
        if (!hasAccess) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
        
        // Build where clause
        const where: any = { projectId: id }
        if (status && status !== "all") {
            where.status = status
        }
        if (priority && priority !== "all") {
            where.priority = priority
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } }
            ]
        }
        
        const [tasks, total] = await Promise.all([
            db.task.findMany({
                where,
                include: {
                    assignees: {
                        include: {
                            user: {
                                select: { id: true, name: true, email: true, avatar: true }
                            }
                        }
                    },
                    creator: {
                        select: { id: true, name: true, email: true, avatar: true }
                    },
                    taskTags: {
                        include: {
                            tag: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit
            }),
            db.task.count({ where })
        ])
        
        return NextResponse.json({
            tasks,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error("Error fetching project tasks:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        
        // Unwrap params Promise
        const { id } = await params
        
        const body = await request.json()
        const {
            title,
            description,
            type = "TASK",
            status = "OPEN",
            priority = "MEDIUM",
            dueDate,
            assigneeIds = [],
            tags = []
        } = body
        
        if (!title) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            )
        }
        
        // Check if user has access to this project
        const project = await db.project.findUnique({
            where: { id },
            include: {
                members: true,
                team: {
                    include: {
                        members: true
                    }
                }
            }
        })
        
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }
        
        // Check if user is a member of the project or team
        const isProjectMember = project.members.some(member => member.id === session.user.id)
        const isTeamMember = project.team?.members.some(member => member.userId === session.user.id)
        const hasAccess = isProjectMember ||
            isTeamMember ||
            session.user.role === "ADMIN" ||
            session.user.role === "MANAGER"
        
        if (!hasAccess) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
        
        // Create the task
        const task = await db.task.create({
            data: {
                title,
                description,
                type,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                projectId: id,
                creatorId: session.user.id,
                taskTags: {
                    create: tags.map((tagName: string) => ({
                        tag: {
                            connectOrCreate: {
                                where: { name: tagName },
                                create: { name: tagName, color: "#6366f1" }
                            }
                        }
                    }))
                }
            },
            include: {
                assignees: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true }
                        }
                    }
                },
                creator: {
                    select: { id: true, name: true, email: true, avatar: true }
                },
                taskTags: {
                    include: {
                        tag: true
                    }
                }
            }
        })
        
        // Add assignees to the task
        if (assigneeIds.length > 0) {
            await db.taskAssignee.createMany({
                data: assigneeIds.map((userId: string) => ({
                    taskId: task.id,
                    userId
                }))
            })
        } else {
            // If no assignees are specified, assign the task to the creator
            await db.taskAssignee.create({
                data: {
                    taskId: task.id,
                    userId: session.user.id
                }
            })
        }
        
        // Create notifications for assignees
        if (assigneeIds.length > 0) {
            for (const userId of assigneeIds) {
                if (userId !== session.user.id) {
                    await db.notification.create({
                        data: {
                            title: "New Task Assigned",
                            message: `You have been assigned to "${title}"`,
                            type: "TASK_ASSIGNED",
                            userId
                        }
                    })
                }
            }
        }
        
        return NextResponse.json(task, { status: 201 })
    } catch (error) {
        console.error("Error creating task:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}