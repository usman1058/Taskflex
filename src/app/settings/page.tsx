"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and application settings
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Application Settings
            </CardTitle>
            <CardDescription>
              Configure your preferences and account settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Settings panel coming soon!</p>
              <p className="text-sm text-muted-foreground mt-2">
                This feature will allow you to customize your experience and manage your account.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}