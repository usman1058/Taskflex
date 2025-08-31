// components/teams/delete-member-dialog.tsx
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
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface RemoveMemberDialogProps {
  teamId: string
  membership: {
    id: string
    userId: string
    role: string
    user: {
      name: string | null
      email: string
    }
  }
  children: React.ReactNode
}

export default function RemoveMemberDialog({ teamId, membership, children }: RemoveMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const router = useRouter()

  const handleRemoveMember = async () => {
    try {
      setIsRemoving(true)
      
      // Call the correct API endpoint
      const response = await fetch(`/api/teams/${teamId}/members/${membership.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to remove member: ${response.status}`)
      }
      
      // Refresh the page to show updated member list
      router.refresh()
      setOpen(false)
    } catch (error) {
      console.error("Error removing member:", error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {membership.user.name || membership.user.email} from the team?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleRemoveMember}
            disabled={isRemoving}
          >
            {isRemoving ? "Removing..." : "Remove Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}