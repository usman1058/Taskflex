"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare, Users, Calendar, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (session) router.push("/dashboard")
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (session) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            TaskFlow
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            The world's most comprehensive task management platform for students, teachers, and teams. 
            Built with features inspired by Zammad and Jira.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-3">
              <Link href="/auth/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <CardTitle>Task Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create, organize, and track tasks with advanced features like priorities, statuses, and tags.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <CardTitle>Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Work together with your team through assignments, comments, and real-time notifications.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <CardTitle>Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track time spent on tasks, set deadlines, and manage your schedule efficiently.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-orange-600" />
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get insights into your productivity with detailed reports and analytics.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8">Everything You Need in One Platform</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Advanced Features</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Multi-channel support (Email, Web, Chat)</li>
                <li>• Custom workflows and automations</li>
                <li>• SLA management and escalations</li>
                <li>• Knowledge base and documentation</li>
                <li>• File attachments and inline images</li>
                <li>• Advanced search and filtering</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Collaboration Tools</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Real-time notifications</li>
                <li>• Team assignments and mentions</li>
                <li>• Comment threads and discussions</li>
                <li>• Shared calendars and scheduling</li>
                <li>• Role-based permissions</li>
                <li>• Activity timelines</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Integrations</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• GitHub and GitLab integration</li>
                <li>• Google and Microsoft 365</li>
                <li>• Slack and Microsoft Teams</li>
                <li>• Custom webhooks and APIs</li>
                <li>• Third-party app connections</li>
                <li>• Zapier automation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}