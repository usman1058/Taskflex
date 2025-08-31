# TaskFlow - Run Locally Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
```bash
# Push the database schema
npm run db:push

# Generate Prisma client
npm run db:generate
```

### 3. Start the Development Server
```bash
npm run dev
```

### 4. Access the Application
Open your browser and navigate to: `http://localhost:3000`

## 🔐 Authentication Setup

### Option 1: Email/Password (Default)
The application works out of the box with email/password authentication. You can:
1. Sign up with any email and password
2. Sign in with your credentials
3. Access all features immediately

### Option 2: OAuth Providers (Optional)
To enable GitHub/Google login:

1. **GitHub OAuth**
   - Go to GitHub Developer Settings
   - Create a new OAuth App
   - Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
   - Add to `.env`:
     ```
     GITHUB_CLIENT_ID=your-github-client-id
     GITHUB_CLIENT_SECRET=your-github-client-secret
     ```

2. **Google OAuth**
   - Go to Google Cloud Console
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Add to `.env`:
     ```
     GOOGLE_CLIENT_ID=your-google-client-id
     GOOGLE_CLIENT_SECRET=your-google-client-secret
     ```

## 📱 Application Features

### Main Pages
- **`/`** - Landing page with feature overview
- **`/auth/signin`** - Sign in page
- **`/auth/signup`** - Sign up page
- **`/dashboard`** - Main dashboard with statistics and overview
- **`/tasks`** - Task list with filtering and search
- **`/tasks/create`** - Create new task
- **`/tasks/[id]`** - Task detail view
- **`/projects`** - Project management
- **`/profile`** - User profile and settings
- **`/teams`** - Team management
- **`/notifications`** - Notification center
- **`/settings`** - Application settings

### Key Features
✅ **Task Management**
- Create, edit, delete tasks
- Assign tasks to team members
- Set priorities (Low, Medium, High, Urgent)
- Track status (Open, In Progress, Review, Done, Closed)
- Add tags and descriptions
- Set due dates

✅ **Collaboration**
- Comment on tasks
- @mention team members
- Real-time notifications
- File attachments
- Time tracking

✅ **Search & Filter**
- Search tasks by title or description
- Filter by status, priority, assignee, project
- Advanced filtering options

✅ **User Management**
- User profiles
- Role-based permissions
- Activity tracking
- Account settings

## 🗄️ Database Schema

The application uses SQLite with Prisma ORM. Key tables:
- `users` - User accounts and profiles
- `tasks` - Task management
- `projects` - Project organization
- `tags` - Task categorization
- `comments` - Task discussions
- `attachments` - File uploads
- `notifications` - User notifications
- `timeEntries` - Time tracking

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:reset     # Reset database
```

## 🌟 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `GET/POST /api/auth/[...nextauth]` - NextAuth routes

### Tasks
- `GET /api/tasks` - Get tasks with filtering
- `POST /api/tasks` - Create new task
- `GET /api/tasks/[id]` - Get task details
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task
- `GET/POST /api/tasks/[id]/comments` - Task comments

### Other Resources
- `GET /api/users` - Get users
- `GET/POST /api/projects` - Projects
- `GET/PUT /api/notifications` - Notifications
- `GET/POST /api/tags` - Tags

## 🎨 UI Components

Built with:
- **shadcn/ui** - Modern, accessible components
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **React Hook Form** - Form handling
- **Zod** - Form validation

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Environment Variables for Production
```env
DATABASE_URL=your-production-database-url
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret
# Add OAuth provider credentials for production
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   npm run db:push
   npm run db:generate
   ```

2. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

3. **Authentication Issues**
   - Check `.env` file for correct NEXTAUTH_URL
   - Ensure NEXTAUTH_SECRET is set
   - Clear browser cookies and cache

4. **Build Errors**
   ```bash
   npm run lint
   npm run build
   ```

## 📞 Support

If you encounter any issues:
1. Check the console for error messages
2. Ensure all dependencies are installed
3. Verify database connection
4. Check environment variables

## 🎉 You're Ready!

Your TaskFlow application is now running locally. You can:
- Sign up as a new user
- Create tasks and projects
- Invite team members
- Collaborate with comments and notifications
- Track time and progress

Enjoy your comprehensive task management platform! 🚀