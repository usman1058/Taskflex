// app/api/voice-agent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfWeek, endOfWeek, subWeeks, format, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { query, sessionId } = await request.json();
    
    // In a real implementation, this would call Dialogflow or another NLP service
    // For this example, we'll simulate intent detection
    const { intent, parameters } = await detectIntent(query);
    
    // Process the intent and call appropriate API
    const response = await processIntent(intent, parameters, session.user.id);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Voice agent error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Simulate intent detection (replace with actual Dialogflow call)
async function detectIntent(query: string) {
  const lowerQuery = query.toLowerCase();
  
  // Task Management
  if (lowerQuery.includes("create task") || lowerQuery.includes("add task")) {
    return {
      intent: "CreateTask",
      parameters: {
        title: extractParameter(query, ["task", "named", "called"]),
        description: extractParameter(query, ["description", "details", "about"]),
        priority: extractParameter(query, ["priority", "importance"]),
        dueDate: extractDateParameter(query),
        projectId: await extractProjectId(query)
      }
    };
  }
  
  if (lowerQuery.includes("show task") || lowerQuery.includes("get task") || lowerQuery.includes("list task")) {
    return {
      intent: "GetTasks",
      parameters: {
        status: extractParameter(query, ["status", "state"]),
        priority: extractParameter(query, ["priority", "importance"]),
        projectId: await extractProjectId(query),
        organizationId: await extractOrganizationId(query)
      }
    };
  }
  
  if (lowerQuery.includes("update task") || lowerQuery.includes("change task")) {
    return {
      intent: "UpdateTask",
      parameters: {
        taskId: extractTaskId(query),
        title: extractParameter(query, ["title", "name"]),
        status: extractParameter(query, ["status", "state"]),
        priority: extractParameter(query, ["priority", "importance"]),
        dueDate: extractDateParameter(query)
      }
    };
  }
  
  if (lowerQuery.includes("assign task") || lowerQuery.includes("delegate task")) {
    return {
      intent: "AssignTask",
      parameters: {
        taskId: extractTaskId(query),
        assigneeName: extractParameter(query, ["to", "assignee", "user"])
      }
    };
  }
  
  // Project Management
  if (lowerQuery.includes("create project") || lowerQuery.includes("add project")) {
    return {
      intent: "CreateProject",
      parameters: {
        name: extractParameter(query, ["project", "named", "called"]),
        description: extractParameter(query, ["description", "details", "about"]),
        organizationId: await extractOrganizationId(query)
      }
    };
  }
  
  if (lowerQuery.includes("show project") || lowerQuery.includes("get project") || lowerQuery.includes("list project")) {
    return {
      intent: "GetProjects",
      parameters: {
        organizationId: await extractOrganizationId(query)
      }
    };
  }
  
  // Team Management
  if (lowerQuery.includes("create team") || lowerQuery.includes("add team")) {
    return {
      intent: "CreateTeam",
      parameters: {
        name: extractParameter(query, ["team", "named", "called"]),
        description: extractParameter(query, ["description", "details", "about"]),
        organizationId: await extractOrganizationId(query)
      }
    };
  }
  
  if (lowerQuery.includes("show team") || lowerQuery.includes("get team") || lowerQuery.includes("list team")) {
    return {
      intent: "GetTeams",
      parameters: {
        organizationId: await extractOrganizationId(query)
      }
    };
  }
  
  if (lowerQuery.includes("invite to team") || lowerQuery.includes("add to team")) {
    return {
      intent: "InviteToTeam",
      parameters: {
        teamId: await extractTeamId(query),
        email: extractEmailParameter(query)
      }
    };
  }
  
  // Organization Management
  if (lowerQuery.includes("create organization") || lowerQuery.includes("add organization")) {
    return {
      intent: "CreateOrganization",
      parameters: {
        name: extractParameter(query, ["organization", "named", "called"]),
        description: extractParameter(query, ["description", "details", "about"])
      }
    };
  }
  
  if (lowerQuery.includes("show organization") || lowerQuery.includes("get organization") || lowerQuery.includes("list organization")) {
    return {
      intent: "GetOrganizations",
      parameters: {}
    };
  }
  
  if (lowerQuery.includes("invite to organization") || lowerQuery.includes("add to organization")) {
    return {
      intent: "InviteToOrganization",
      parameters: {
        organizationId: await extractOrganizationId(query),
        email: extractEmailParameter(query)
      }
    };
  }
  
  // Analytics
  if (lowerQuery.includes("analytics") || lowerQuery.includes("report") || lowerQuery.includes("statistics")) {
    return {
      intent: "GetAnalytics",
      parameters: {
        organizationId: await extractOrganizationId(query),
        weeks: extractNumberParameter(query, ["weeks", "week"]),
        months: extractNumberParameter(query, ["months", "month"])
      }
    };
  }
  
  // Notifications
  if (lowerQuery.includes("notification") || lowerQuery.includes("alert") || lowerQuery.includes("message")) {
    return {
      intent: "GetNotifications",
      parameters: {
        unread: lowerQuery.includes("unread")
      }
    };
  }
  
  // Default response
  return {
    intent: "Unknown",
    parameters: {}
  };
}

async function processIntent(intent: string, parameters: any, userId: string) {
  switch (intent) {
    case "CreateTask":
      return await createTask(parameters, userId);
    case "GetTasks":
      return await getTasks(parameters, userId);
    case "UpdateTask":
      return await updateTask(parameters, userId);
    case "AssignTask":
      return await assignTask(parameters, userId);
    case "CreateProject":
      return await createProject(parameters, userId);
    case "GetProjects":
      return await getProjects(parameters, userId);
    case "CreateTeam":
      return await createTeam(parameters, userId);
    case "GetTeams":
      return await getTeams(parameters, userId);
    case "InviteToTeam":
      return await inviteToTeam(parameters, userId);
    case "CreateOrganization":
      return await createOrganization(parameters, userId);
    case "GetOrganizations":
      return await getOrganizations(parameters, userId);
    case "InviteToOrganization":
      return await inviteToOrganization(parameters, userId);
    case "GetAnalytics":
      return await getAnalytics(parameters, userId);
    case "GetNotifications":
      return await getNotifications(parameters, userId);
    default:
      return { text: "I didn't understand that command. Please try again." };
  }
}

// Task Management Functions
async function createTask(parameters: any, userId: string) {
  const { title, description, priority, dueDate, projectId } = parameters;
  
  if (!title) {
    return { text: "Please specify a task title." };
  }
  
  const task = await db.task.create({
    data: {
      title,
      description: description || "",
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId: projectId || null,
      creatorId: userId,
    },
    include: {
      project: {
        select: { name: true }
      },
      assignees: {
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }
    }
  });
  
  return { 
    text: `Task "${title}" created successfully.`,
    data: task 
  };
}

async function getTasks(parameters: any, userId: string) {
  const { status, priority, projectId, organizationId } = parameters;
  
  const whereClause: any = {
    OR: [
      { assignees: { some: { userId } } },
      { creatorId: userId }
    ]
  };
  
  if (status) whereClause.status = status.toUpperCase();
  if (priority) whereClause.priority = priority.toUpperCase();
  if (projectId) whereClause.projectId = projectId;
  
  if (organizationId) {
    whereClause.project = {
      organizationId: organizationId
    };
  }
  
  const tasks = await db.task.findMany({
    where: whereClause,
    include: {
      project: {
        select: { name: true, key: true }
      },
      assignees: {
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      },
      creator: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  
  if (tasks.length === 0) {
    return { text: "No tasks found matching your criteria." };
  }
  
  const taskList = tasks.map(task => 
    `- ${task.title} (Status: ${task.status}, Priority: ${task.priority})`
  ).join("\n");
  
  return { 
    text: `Found ${tasks.length} tasks:\n${taskList}`,
    data: tasks 
  };
}

async function updateTask(parameters: any, userId: string) {
  const { taskId, title, status, priority, dueDate } = parameters;
  
  if (!taskId) {
    return { text: "Please specify a task ID." };
  }
  
  const updateData: any = {};
  if (title) updateData.title = title;
  if (status) updateData.status = status.toUpperCase();
  if (priority) updateData.priority = priority.toUpperCase();
  if (dueDate) updateData.dueDate = new Date(dueDate);
  
  const task = await db.task.update({
    where: { id: taskId },
    data: updateData,
    include: {
      project: {
        select: { name: true }
      },
      assignees: {
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }
    }
  });
  
  return { 
    text: `Task "${task.title}" updated successfully.`,
    data: task 
  };
}

async function assignTask(parameters: any, userId: string) {
  const { taskId, assigneeName } = parameters;
  
  if (!taskId || !assigneeName) {
    return { text: "Please specify both task ID and assignee name." };
  }
  
  // Find user by name
  const user = await db.user.findFirst({
    where: {
      OR: [
        { name: { contains: assigneeName, mode: "insensitive" } },
        { email: { contains: assigneeName, mode: "insensitive" } }
      ]
    }
  });
  
  if (!user) {
    return { text: `User "${assigneeName}" not found.` };
  }
  
  // Check if task exists
  const task = await db.task.findUnique({
    where: { id: taskId }
  });
  
  if (!task) {
    return { text: `Task with ID ${taskId} not found.` };
  }
  
  // Check if already assigned
  const existingAssignment = await db.taskAssignee.findUnique({
    where: {
      taskId_userId: {
        taskId,
        userId: user.id
      }
    }
  });
  
  if (existingAssignment) {
    return { text: `Task is already assigned to ${user.name}.` };
  }
  
  // Create assignment
  const assignment = await db.taskAssignee.create({
    data: {
      taskId,
      userId: user.id
    },
    include: {
      user: {
        select: { name: true, email: true }
      },
      task: {
        select: { title: true }
      }
    }
  });
  
  // Create notification
  await db.notification.create({
    data: {
      title: "Task Assigned",
      message: `You have been assigned to task: ${task.title}`,
      type: "TASK_ASSIGNED",
      userId: user.id
    }
  });
  
  return { 
    text: `Task "${task.title}" assigned to ${user.name} successfully.`,
    data: assignment 
  };
}

// Project Management Functions
async function createProject(parameters: any, userId: string) {
  const { name, description, organizationId } = parameters;
  
  if (!name) {
    return { text: "Please specify a project name." };
  }
  
  // Generate project key
  const key = name.substring(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
  
  const project = await db.project.create({
    data: {
      name,
      description: description || "",
      key,
      organizationId: organizationId || null
    },
    include: {
      organization: {
        select: { name: true }
      },
      members: {
        select: { id: true, name: true, email: true }
      }
    }
  });
  
  return { 
    text: `Project "${name}" created successfully with key ${key}.`,
    data: project 
  };
}

async function getProjects(parameters: any, userId: string) {
  const { organizationId } = parameters;
  
  const whereClause: any = {};
  
  if (organizationId) {
    whereClause.organizationId = organizationId;
  }
  
  const projects = await db.project.findMany({
    where: whereClause,
    include: {
      organization: {
        select: { name: true }
      },
      members: {
        select: { id: true, name: true, email: true }
      },
      _count: {
        select: { tasks: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  
  if (projects.length === 0) {
    return { text: "No projects found." };
  }
  
  const projectList = projects.map(project => 
    `- ${project.name} (${project.key}) - ${project._count.tasks} tasks`
  ).join("\n");
  
  return { 
    text: `Found ${projects.length} projects:\n${projectList}`,
    data: projects 
  };
}

// Team Management Functions
async function createTeam(parameters: any, userId: string) {
  const { name, description, organizationId } = parameters;
  
  if (!name) {
    return { text: "Please specify a team name." };
  }
  
  const team = await db.team.create({
    data: {
      name,
      description: description || "",
      organizationId: organizationId || null,
      ownerId: userId
    },
    include: {
      organization: {
        select: { name: true }
      },
      members: {
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }
    }
  });
  
  return { 
    text: `Team "${name}" created successfully.`,
    data: team 
  };
}

async function getTeams(parameters: any, userId: string) {
  const { organizationId } = parameters;
  
  const whereClause: any = {};
  
  if (organizationId) {
    whereClause.organizationId = organizationId;
  }
  
  const teams = await db.team.findMany({
    where: whereClause,
    include: {
      organization: {
        select: { name: true }
      },
      members: {
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      },
      _count: {
        select: { members: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  
  if (teams.length === 0) {
    return { text: "No teams found." };
  }
  
  const teamList = teams.map(team => 
    `- ${team.name} - ${team._count.members} members`
  ).join("\n");
  
  return { 
    text: `Found ${teams.length} teams:\n${teamList}`,
    data: teams 
  };
}

async function inviteToTeam(parameters: any, userId: string) {
  const { teamId, email } = parameters;
  
  if (!teamId || !email) {
    return { text: "Please specify both team ID and email address." };
  }
  
  // Find user by email
  const user = await db.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    return { text: `User with email ${email} not found.` };
  }
  
  // Check if team exists
  const team = await db.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        where: { userId: user.id }
      }
    }
  });
  
  if (!team) {
    return { text: `Team with ID ${teamId} not found.` };
  }
  
  if (team.members.length > 0) {
    return { text: `User is already a member of team "${team.name}".` };
  }
  
  // Create team membership
  const membership = await db.teamMembership.create({
    data: {
      userId: user.id,
      teamId: team.id,
      status: "ACTIVE"
    },
    include: {
      user: {
        select: { name: true, email: true }
      },
      team: {
        select: { name: true }
      }
    }
  });
  
  // Create notification
  await db.notification.create({
    data: {
      title: "Team Invitation",
      message: `You have been added to team: ${team.name}`,
      type: "TEAM_INVITATION",
      userId: user.id
    }
  });
  
  return { 
    text: `${user.name} added to team "${team.name}" successfully.`,
    data: membership 
  };
}

// Organization Management Functions
async function createOrganization(parameters: any, userId: string) {
  const { name, description } = parameters;
  
  if (!name) {
    return { text: "Please specify an organization name." };
  }
  
  const organization = await db.organization.create({
    data: {
      name,
      description: description || ""
    },
    include: {
      members: {
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }
    }
  });
  
  // Add creator as owner
  await db.organizationMember.create({
    data: {
      userId,
      organizationId: organization.id,
      role: "OWNER"
    }
  });
  
  return { 
    text: `Organization "${name}" created successfully.`,
    data: organization 
  };
}

async function getOrganizations(parameters: any, userId: string) {
  const organizations = await db.organization.findMany({
    include: {
      members: {
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      },
      _count: {
        select: { 
          projects: true,
          teams: true,
          members: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  
  if (organizations.length === 0) {
    return { text: "No organizations found." };
  }
  
  const orgList = organizations.map(org => 
    `- ${org.name} - ${org._count.projects} projects, ${org._count.teams} teams, ${org._count.members} members`
  ).join("\n");
  
  return { 
    text: `Found ${organizations.length} organizations:\n${orgList}`,
    data: organizations 
  };
}

async function inviteToOrganization(parameters: any, userId: string) {
  const { organizationId, email } = parameters;
  
  if (!organizationId || !email) {
    return { text: "Please specify both organization ID and email address." };
  }
  
  // Find user by email
  const user = await db.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    return { text: `User with email ${email} not found.` };
  }
  
  // Check if organization exists
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        where: { userId: user.id }
      }
    }
  });
  
  if (!organization) {
    return { text: `Organization with ID ${organizationId} not found.` };
  }
  
  if (organization.members.length > 0) {
    return { text: `User is already a member of organization "${organization.name}".` };
  }
  
  // Create organization membership
  const membership = await db.organizationMember.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      role: "MEMBER"
    },
    include: {
      user: {
        select: { name: true, email: true }
      },
      organization: {
        select: { name: true }
      }
    }
  });
  
  // Create notification
  await db.notification.create({
    data: {
      title: "Organization Invitation",
      message: `You have been added to organization: ${organization.name}`,
      type: "SYSTEM",
      userId: user.id
    }
  });
  
  return { 
    text: `${user.name} added to organization "${organization.name}" successfully.`,
    data: membership 
  };
}

// Analytics Function
async function getAnalytics(parameters: any, userId: string) {
  const { organizationId, weeks = 4, months = 6 } = parameters;
  
  // Get user role to determine permissions
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  
  if (!user) {
    return { text: "User not found." };
  }
  
  // Build the base where clause for tasks
  const baseTaskWhere: any = {
    OR: [
      { assignees: { some: { userId } } },
      { creatorId: userId }
    ]
  };
  
  // Add organization filter if provided
  if (organizationId && organizationId !== "ALL") {
    baseTaskWhere.project = {
      organizationId: organizationId
    };
  }
  
  // Fetch all analytics data in parallel
  const [taskAnalytics, productivityAnalytics, teamAnalytics] = await Promise.all([
    getTaskAnalytics(baseTaskWhere, months, organizationId, user),
    getProductivityAnalytics(baseTaskWhere, weeks),
    user.role === "MANAGER" || user.role === "ADMIN" 
      ? getTeamAnalytics(organizationId, user) 
      : Promise.resolve(null)
  ]);
  
  // Format response
  let responseText = "Here's your analytics report:\n\n";
  
  // Task Analytics
  if (taskAnalytics.tasksByStatus && taskAnalytics.tasksByStatus.length > 0) {
    responseText += "Tasks by Status:\n";
    taskAnalytics.tasksByStatus.forEach((status: any) => {
      responseText += `- ${status.status}: ${status._count.id}\n`;
    });
    responseText += "\n";
  }
  
  if (taskAnalytics.tasksByPriority && taskAnalytics.tasksByPriority.length > 0) {
    responseText += "Tasks by Priority:\n";
    taskAnalytics.tasksByPriority.forEach((priority: any) => {
      responseText += `- ${priority.priority}: ${priority._count.id}\n`;
    });
    responseText += "\n";
  }
  
  // Productivity Analytics
  if (productivityAnalytics.weeklyProductivity && productivityAnalytics.weeklyProductivity.length > 0) {
    responseText += "Weekly Productivity:\n";
    productivityAnalytics.weeklyProductivity.forEach((week: any) => {
      responseText += `- ${week.week}: ${week.weekTotal} tasks completed\n`;
    });
    responseText += `\nAverage completion time: ${productivityAnalytics.avgCompletionTime} days\n`;
    responseText += `Current streak: ${productivityAnalytics.currentStreak} days\n\n`;
  }
  
  // Team Analytics (if available)
  if (teamAnalytics && teamAnalytics.teamProductivity && teamAnalytics.teamProductivity.length > 0) {
    responseText += "Team Productivity:\n";
    teamAnalytics.teamProductivity.slice(0, 5).forEach((member: any) => {
      responseText += `- ${member.name}: ${member.completionRate}% completion rate\n`;
    });
  }
  
  return { 
    text: responseText,
    data: {
      taskAnalytics,
      productivityAnalytics,
      teamAnalytics
    }
  };
}

// Notifications Function
async function getNotifications(parameters: any, userId: string) {
  const { unread } = parameters;
  
  const whereClause: any = { userId };
  
  if (unread) {
    whereClause.read = false;
  }
  
  const notifications = await db.notification.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 20
  });
  
  if (notifications.length === 0) {
    return { text: unread ? "No unread notifications." : "No notifications found." };
  }
  
  const notificationList = notifications.map(notification => 
    `- ${notification.title}: ${notification.message} (${notification.read ? 'Read' : 'Unread'})`
  ).join("\n");
  
  return { 
    text: `Found ${notifications.length} notifications:\n${notificationList}`,
    data: notifications 
  };
}

// Helper Functions
async function extractProjectId(query: string): Promise<string | null> {
  // In a real implementation, this would use NLP to extract project name
  // For now, we'll look for project keys in the query
  const projectKeyMatch = query.match(/\b([A-Z]{3,4}-\d{4})\b/);
  if (projectKeyMatch) {
    const project = await db.project.findUnique({
      where: { key: projectKeyMatch[1] }
    });
    return project?.id || null;
  }
  
  // Try to find project by name
  const projectNameMatch = query.match(/project\s+["']?([^"'\s]+)["']?/i);
  if (projectNameMatch) {
    const project = await db.project.findFirst({
      where: {
        name: { contains: projectNameMatch[1], mode: "insensitive" }
      }
    });
    return project?.id || null;
  }
  
  return null;
}

async function extractOrganizationId(query: string): Promise<string | null> {
  // Try to find organization by name
  const orgNameMatch = query.match(/organization\s+["']?([^"'\s]+)["']?/i);
  if (orgNameMatch) {
    const org = await db.organization.findFirst({
      where: {
        name: { contains: orgNameMatch[1], mode: "insensitive" }
      }
    });
    return org?.id || null;
  }
  
  return null;
}

async function extractTeamId(query: string): Promise<string | null> {
  // Try to find team by name
  const teamNameMatch = query.match(/team\s+["']?([^"'\s]+)["']?/i);
  if (teamNameMatch) {
    const team = await db.team.findFirst({
      where: {
        name: { contains: teamNameMatch[1], mode: "insensitive" }
      }
    });
    return team?.id || null;
  }
  
  return null;
}

function extractTaskId(query: string): string | null {
  // Look for task ID pattern
  const taskIdMatch = query.match(/\b([a-f0-9]{20,})\b/);
  return taskIdMatch ? taskIdMatch[1] : null;
}

function extractParameter(query: string, keywords: string[]): string | null {
  // Simple extraction - in real implementation use NLP
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}\\s+["']?([^"'\s,]+)["']?`, "i");
    const match = query.match(regex);
    if (match) return match[1];
  }
  return null;
}

function extractDateParameter(query: string): string | null {
  // Look for date patterns
  const dateMatch = query.match(/(today|tomorrow|next week|next month|\d{1,2}\/\d{1,2}\/\d{4})/i);
  return dateMatch ? dateMatch[1] : null;
}

function extractEmailParameter(query: string): string | null {
  // Look for email pattern
  const emailMatch = query.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
  return emailMatch ? emailMatch[1] : null;
}

function extractNumberParameter(query: string, keywords: string[]): number | null {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}\\s+(\\d+)`, "i");
    const match = query.match(regex);
    if (match) return parseInt(match[1]);
  }
  return null;
}

// Analytics Helper Functions (copied from analytics route)
async function getTaskAnalytics(baseWhere: any, months: number, organizationId: string | null, user: any) {
  // Get tasks by status
  const tasksByStatus = await db.task.groupBy({
    by: ["status"],
    where: baseWhere,
    _count: {
      id: true
    }
  });
  
  // Get tasks by priority
  const tasksByPriority = await db.task.groupBy({
    by: ["priority"],
    where: baseWhere,
    _count: {
      id: true
    }
  });
  
  // Get tasks completed per month for the last N months
  const now = new Date();
  const monthsData = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    
    const completedTasks = await db.task.count({
      where: {
        status: "DONE",
        ...baseWhere,
        updatedAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });
    
    monthsData.push({
      month: format(monthStart, "MMM yyyy"),
      completedTasks
    });
  }
  
  return {
    tasksByStatus,
    tasksByPriority,
    tasksByMonth: monthsData
  };
}

async function getProductivityAnalytics(baseWhere: any, weeks: number) {
  // Get tasks completed per day for the last N weeks
  const now = new Date();
  
  const weeksData = [];
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i));
    const weekEnd = endOfWeek(subWeeks(now, i));
    
    const completedTasks = await db.task.count({
      where: {
        ...baseWhere,
        status: "DONE",
        updatedAt: {
          gte: weekStart,
          lte: weekEnd
        }
      }
    });
    
    weeksData.push({
      week: `Week ${weeks - i}`,
      weekStart: format(weekStart, "MMM dd"),
      weekEnd: format(weekEnd, "MMM dd"),
      weekTotal: completedTasks
    });
  }
  
  // Get average time to complete tasks
  const completedTasks = await db.task.findMany({
    where: {
      ...baseWhere,
      status: "DONE"
    },
    select: {
      createdAt: true,
      updatedAt: true
    }
  });
  
  const completionTimes = completedTasks.map(task => {
    const created = new Date(task.createdAt).getTime();
    const completed = new Date(task.updatedAt).getTime();
    return (completed - created) / (1000 * 60 * 60 * 24); // Convert to days
  });
  
  const avgCompletionTime = completionTimes.length > 0
    ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
    : 0;
  
  // Get current streak of completed tasks
  const sortedTasks = await db.task.findMany({
    where: {
      ...baseWhere,
      status: "DONE"
    },
    orderBy: {
      updatedAt: "desc"
    },
    select: {
      updatedAt: true
    }
  });
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const task of sortedTasks) {
    const taskDate = new Date(task.updatedAt);
    taskDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((currentDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak) {
      streak++;
    } else {
      break;
    }
  }
  
  return {
    weeklyProductivity: weeksData,
    avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
    currentStreak: streak,
    totalCompleted: completedTasks.length
  };
}

async function getTeamAnalytics(organizationId: string | null, user: any) {
  // Build the base where clause
  const baseWhere: any = {};
  
  // Add organization filter if provided
  if (organizationId && organizationId !== "ALL") {
    baseWhere.project = {
      organizationId: organizationId
    };
  }
  
  // Get team member productivity
  const teamMembers = await db.user.findMany({
    where: {
      role: {
        in: ["USER", "AGENT"]
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true
    }
  });
  
  const teamProductivity = await Promise.all(
    teamMembers.map(async (member) => {
      const assignedTasks = await db.task.count({
        where: {
          assignees: {
            some: {
              userId: member.id
            }
          },
          ...baseWhere
        }
      });
      
      const completedTasks = await db.task.count({
        where: {
          assignees: {
            some: {
              userId: member.id
            }
          },
          status: "DONE",
          ...baseWhere
        }
      });
      
      return {
        ...member,
        assignedTasks,
        completedTasks,
        completionRate: assignedTasks > 0 
          ? Math.round((completedTasks / assignedTasks) * 100) 
          : 0
      };
    })
  );
  
  // Sort by completion rate
  teamProductivity.sort((a, b) => b.completionRate - a.completionRate);
  
  return {
    teamProductivity
  };
}