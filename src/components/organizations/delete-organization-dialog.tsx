// components/organizations/delete-organization-dialog.tsx
"use client"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"

interface DeleteOrganizationDialogProps {
  children: React.ReactNode
  organization: {
    id: string
    name: string
  }
  onSuccess: () => void
}

export default function DeleteOrganizationDialog({ 
  children, 
  organization, 
  onSuccess 
}: DeleteOrganizationDialogProps) {
  const [open, setOpen] = useState(false)
  const [adminKey, setAdminKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!adminKey.trim()) {
      setError("Admin key is required")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": adminKey
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete organization")
      }

      setOpen(false)
      setAdminKey("")
      onSuccess()
    } catch (error) {
      console.error("Error deleting organization:", error)
      setError(error instanceof Error ? error.message : "Failed to delete organization")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Organization
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the organization
            and all associated data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You are about to delete <strong>{organization.name}</strong>. 
              All projects, teams, and tasks within this organization will be permanently deleted.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="adminKey">Admin Key</Label>
            <Input
              id="adminKey"
              type="password"
              placeholder="Enter admin key to confirm deletion"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              This key was provided when the organization was created. It's required for security.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isLoading || !adminKey.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Organization"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}