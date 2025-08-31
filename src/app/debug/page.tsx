"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"

interface User {
  id: string
  name: string
  email: string
}

interface Project {
  id: string
  name: string
  key: string
}

export default function DebugPage() {
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [usersResponse, projectsResponse] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/projects")
    ])

    if (usersResponse.ok) {
      const usersData = await usersResponse.json()
      setUsers(usersData)
    }

    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json()
      setProjects(projectsData)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Debug Information</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold mb-4">Users</h2>
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="p-3 border rounded">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Name:</strong> {user.name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Projects</h2>
            <div className="space-y-2">
              {projects.map((project) => (
                <div key={project.id} className="p-3 border rounded">
                  <p><strong>ID:</strong> {project.id}</p>
                  <p><strong>Name:</strong> {project.name}</p>
                  <p><strong>Key:</strong> {project.key}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}