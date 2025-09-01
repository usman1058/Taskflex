const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// At the top of seed.js
const bcrypt = require('bcryptjs')

// Function to hash password
async function hashPassword(password) {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}
async function main() {
  console.log('Start seeding...')
  try {
    // Clean existing data in a safe way
    console.log('Cleaning existing data...')
    
    // Delete in correct order to respect foreign key constraints
    await prisma.notification.deleteMany().catch(() => console.log('No notifications to delete'))
    await prisma.timeEntry.deleteMany().catch(() => console.log('No time entries to delete'))
    await prisma.comment.deleteMany().catch(() => console.log('No comments to delete'))
    await prisma.taskTag.deleteMany().catch(() => console.log('No task tags to delete'))
    await prisma.watchedTask.deleteMany().catch(() => console.log('No watched tasks to delete'))
    await prisma.attachment.deleteMany().catch(() => console.log('No attachments to delete'))
    await prisma.task.deleteMany().catch(() => console.log('No tasks to delete'))
    await prisma.teamMembership.deleteMany().catch(() => console.log('No team memberships to delete'))
    await prisma.team.deleteMany().catch(() => console.log('No teams to delete'))
    await prisma.workflowStatus.deleteMany().catch(() => console.log('No workflow statuses to delete'))
    await prisma.workflow.deleteMany().catch(() => console.log('No workflows to delete'))
    await prisma.sLA.deleteMany().catch(() => console.log('No SLAs to delete'))
    await prisma.tag.deleteMany().catch(() => console.log('No tags to delete'))
    await prisma.project.deleteMany().catch(() => console.log('No projects to delete'))
    await prisma.organization.deleteMany().catch(() => console.log('No organizations to delete'))
    await prisma.user.deleteMany().catch(() => console.log('No users to delete'))
    console.log('Database cleaned successfully!')
    
    // Create organizations
    const organization1 = await prisma.organization.create({
      data: {
        name: 'TechCorp.',
        description: 'A leading technology company',
        avatar: '/organizations/techcorp.png'
      }
    })
    const organization2 = await prisma.organization.create({
      data: {
        name: 'StartUp Labs',
        description: 'Innovative startup incubator',
        avatar: '/organizations/startuplabs.png'
      }
    })
    
    // Create users with unique emails
    const user1 = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'John Doe',
        avatar: '/avatars/john.jpg',
        role: 'ADMIN',
        status: 'ACTIVE',
        password: await hashPassword('admin123')
      }
    })
    const user2 = await prisma.user.create({
      data: {
        email: 'admin2@example.com',
        name: 'Jane Smith',
        avatar: '/avatars/jane.jpg',
        role: 'MANAGER',
        status: 'ACTIVE',
        password: await hashPassword('admin123')
      }
    })
    const user3 = await prisma.user.create({
      data: {
        email: 'mike.johnson@example.com',
        name: 'Mike Johnson',
        avatar: '/avatars/mike.jpg',
        role: 'AGENT',
        status: 'ACTIVE',
        password: await hashPassword('admin123')
      }
    })
    const user4 = await prisma.user.create({
      data: {
        email: 'sarah.wilson@example.com',
        name: 'Sarah Wilson',
        avatar: '/avatars/sarah.jpg',
        role: 'ADMIN',
        status: 'ACTIVE',
        password: await hashPassword('admin123')
      }
    })
    const user5 = await prisma.user.create({
      data: {
        email: 'alex.brown@example.com',
        name: 'Alex Brown',
        avatar: '/avatars/alex.jpg',
        role: 'USER',
        status: 'ACTIVE',
        password: await hashPassword('admin123')
      }
    })
    const user6 = await prisma.user.create({
      data: {
        email: 'emma.davis@example.com',
        name: 'Emma Davis',
        avatar: '/avatars/emma.jpg',
        role: 'USER',
        status: 'ACTIVE',
        password: await hashPassword('admin123')
      }
    })
    
    // Create teams
    const team1 = await prisma.team.create({
      data: {
        name: 'Development Team',
        description: 'Core development team for all projects',
        status: 'ACTIVE',
        ownerId: user1.id,
        organizationId: organization1.id,
      }
    })
    const team2 = await prisma.team.create({
      data: {
        name: 'Design Team',
        description: 'UI/UX design and user experience team',
        status: 'ACTIVE',
        ownerId: user4.id,
        organizationId: organization1.id,
      }
    })
    const team3 = await prisma.team.create({
      data: {
        name: 'Product Team',
        description: 'Product management and strategy team',
        status: 'ACTIVE',
        ownerId: user2.id,
        organizationId: organization2.id,
      }
    })
    
    // Create team memberships
    await prisma.teamMembership.createMany({
      data: [
        // Team 1 memberships
        {
          userId: user1.id,
          teamId: team1.id,
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: new Date('2024-01-01')
        },
        {
          userId: user2.id,
          teamId: team1.id,
          role: 'ADMIN',
          status: 'ACTIVE',
          joinedAt: new Date('2024-01-02')
        },
        {
          userId: user3.id,
          teamId: team1.id,
          role: 'MEMBER',
          status: 'ACTIVE',
          joinedAt: new Date('2024-01-03')
        },
        {
          userId: user5.id,
          teamId: team1.id,
          role: 'MEMBER',
          status: 'ACTIVE',
          joinedAt: new Date('2024-01-04')
        },
        // Team 2 memberships
        {
          userId: user4.id,
          teamId: team2.id,
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: new Date('2024-01-01')
        },
        {
          userId: user6.id,
          teamId: team2.id,
          role: 'ADMIN',
          status: 'ACTIVE',
          joinedAt: new Date('2024-01-05')
        },
        // Team 3 memberships
        {
          userId: user2.id,
          teamId: team3.id,
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: new Date('2024-01-01')
        },
        {
          userId: user1.id,
          teamId: team3.id,
          role: 'MEMBER',
          status: 'ACTIVE',
          joinedAt: new Date('2024-01-06')
        }
      ]
    })
    
    // Create projects (with team associations)
    const project1 = await prisma.project.create({
      data: {
        name: 'Website Redesign',
        description: 'Complete redesign of company website',
        key: 'WR',
        status: 'ACTIVE',
        organizationId: organization1.id,
        teamId: team1.id,
      }
    })
    const project2 = await prisma.project.create({
      data: {
        name: 'Mobile App Development',
        description: 'Development of new mobile application',
        key: 'MAD',
        status: 'ACTIVE',
        organizationId: organization1.id,
        teamId: team1.id,
      }
    })
    const project3 = await prisma.project.create({
      data: {
        name: 'API Integration',
        description: 'Third-party API integration project',
        key: 'API',
        status: 'ACTIVE',
        organizationId: organization2.id,
        teamId: team3.id,
      }
    })
    const project4 = await prisma.project.create({
      data: {
        name: 'Design System',
        description: 'Create a unified design system for all products',
        key: 'DS',
        status: 'ACTIVE',
        organizationId: organization1.id,
        teamId: team2.id,
      }
    })
    
    // Create tags
    const tag1 = await prisma.tag.create({
      data: {
        name: 'Frontend',
        color: '#3B82F6'
      }
    })
    const tag2 = await prisma.tag.create({
      data: {
        name: 'Backend',
        color: '#10B981'
      }
    })
    const tag3 = await prisma.tag.create({
      data: {
        name: 'UI/UX',
        color: '#8B5CF6'
      }
    })
    const tag4 = await prisma.tag.create({
      data: {
        name: 'Bug',
        color: '#EF4444'
      }
    })
    const tag5 = await prisma.tag.create({
      data: {
        name: 'Feature',
        color: '#F59E0B'
      }
    })
    const tag6 = await prisma.tag.create({
      data: {
        name: 'Documentation',
        color: '#6B7280'
      }
    })
    
    // Create tasks (with team associations)
    const task1 = await prisma.task.create({
      data: {
        title: 'Complete project documentation',
        description: 'Write comprehensive documentation for the new project including API references, user guides, and technical specifications.',
        type: 'TASK',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date('2024-01-15'),
        projectId: project1.id,
        teamId: team1.id,
        creatorId: user1.id,
        assigneeId: user2.id,
        taskTags: {
          create: [
            { tagId: tag6.id }
          ]
        }
      }
    })
    const task2 = await prisma.task.create({
      data: {
        title: 'Review pull requests',
        description: 'Review and merge pending pull requests for the mobile app development',
        type: 'TASK',
        status: 'OPEN',
        priority: 'MEDIUM',
        dueDate: new Date('2024-01-12'),
        projectId: project2.id,
        teamId: team1.id,
        creatorId: user2.id,
        assigneeId: user3.id,
        taskTags: {
          create: [
            { tagId: tag1.id },
            { tagId: tag2.id }
          ]
        }
      }
    })
    const task3 = await prisma.task.create({
      data: {
        title: 'Fix login authentication bug',
        description: 'Users are reporting issues with login authentication on the mobile app',
        type: 'BUG',
        status: 'DONE',
        priority: 'URGENT',
        dueDate: new Date('2024-01-10'),
        projectId: project2.id,
        teamId: team1.id,
        creatorId: user4.id,
        assigneeId: user3.id,
        taskTags: {
          create: [
            { tagId: tag4.id },
            { tagId: tag2.id }
          ]
        }
      }
    })
    const task4 = await prisma.task.create({
      data: {
        title: 'Update user interface design',
        description: 'Redesign the user interface based on the new design system and user feedback',
        type: 'TASK',
        status: 'REVIEW',
        priority: 'LOW',
        dueDate: new Date('2024-01-18'),
        projectId: project1.id,
        teamId: team2.id,
        creatorId: user1.id,
        assigneeId: user2.id,
        taskTags: {
          create: [
            { tagId: tag3.id },
            { tagId: tag1.id }
          ]
        }
      }
    })
    const task5 = await prisma.task.create({
      data: {
        title: 'Create design system components',
        description: 'Design and implement reusable components for the design system',
        type: 'TASK',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date('2024-01-20'),
        projectId: project4.id,
        teamId: team2.id,
        creatorId: user4.id,
        assigneeId: user6.id,
        taskTags: {
          create: [
            { tagId: tag3.id },
            { tagId: tag5.id }
          ]
        }
      }
    })
    const task6 = await prisma.task.create({
      data: {
        title: 'Research API providers',
        description: 'Research and evaluate third-party API providers for integration',
        type: 'TASK',
        status: 'OPEN',
        priority: 'MEDIUM',
        dueDate: new Date('2024-01-25'),
        projectId: project3.id,
        teamId: team3.id,
        creatorId: user2.id,
        assigneeId: user5.id,
        taskTags: {
          create: [
            { tagId: tag2.id },
            { tagId: tag6.id }
          ]
        }
      }
    })
    
    // Create comments
    await prisma.comment.createMany({
      data: [
        {
          content: "I've started working on the API documentation. Should I include examples for each endpoint?",
          taskId: task1.id,
          authorId: user2.id,
          createdAt: new Date('2024-01-09T10:30:00Z')
        },
        {
          content: "Yes, please include examples. Also make sure to document the authentication flow.",
          taskId: task1.id,
          authorId: user1.id,
          createdAt: new Date('2024-01-09T11:15:00Z')
        },
        {
          content: "I'll add the authentication flow examples. Should be done by tomorrow.",
          taskId: task1.id,
          authorId: user2.id,
          createdAt: new Date('2024-01-09T14:20:00Z')
        },
        {
          content: "The login bug has been fixed. Please test and confirm.",
          taskId: task3.id,
          authorId: user3.id,
          createdAt: new Date('2024-01-10T09:15:00Z')
        },
        {
          content: "Tested and confirmed. The login is working correctly now.",
          taskId: task3.id,
          authorId: user4.id,
          createdAt: new Date('2024-01-10T10:30:00Z')
        }
      ]
    })
    
    // Create time entries
    await prisma.timeEntry.createMany({
      data: [
        {
          description: 'Research and planning',
          duration: 120,
          date: new Date('2024-01-08'),
          taskId: task1.id,
          userId: user2.id
        },
        {
          description: 'Writing API documentation',
          duration: 180,
          date: new Date('2024-01-09'),
          taskId: task1.id,
          userId: user2.id
        },
        {
          description: 'Debugging authentication issue',
          duration: 240,
          date: new Date('2024-01-09'),
          taskId: task3.id,
          userId: user3.id
        },
        {
          description: 'Creating UI components',
          duration: 180,
          date: new Date('2024-01-10'),
          taskId: task5.id,
          userId: user6.id
        }
      ]
    })
    
    // Create notifications
    await prisma.notification.createMany({
      data: [
        {
          title: 'New Task Assigned',
          message: 'You have been assigned to "Complete project documentation"',
          type: 'TASK_ASSIGNED',
          userId: user2.id
        },
        {
          title: 'Task Completed',
          message: '"Fix login authentication bug" has been completed',
          type: 'TASK_COMPLETED',
          userId: user4.id
        },
        {
          title: 'Team Invitation',
          message: 'You have been invited to join "Design Team"',
          type: 'TEAM_INVITATION',
          userId: user6.id
        }
      ]
    })
    
    console.log('Seeding completed successfully!')
    console.log('Created:')
    console.log('- 2 organizations')
    console.log('- 6 users')
    console.log('- 3 teams')
    console.log('- 8 team memberships')
    console.log('- 4 projects')
    console.log('- 6 tags')
    console.log('- 6 tasks')
    console.log('- 5 comments')
    console.log('- 4 time entries')
    console.log('- 3 notifications')
  } catch (error) {
    console.error('Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })