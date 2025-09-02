"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Video } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ScheduleMeetingDialogProps {
  children: React.ReactNode
  team: {
    id: string
    name: string
  }
}

export function ScheduleMeetingDialog({ children, team }: ScheduleMeetingDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())

  const handleContinue = () => {
    if (date) {
      setOpen(false)
      router.push(`/teams/${team.id}/meetings/schedule/time?teamId=${team.id}&date=${date.toISOString()}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Schedule Meeting
          </DialogTitle>
          <DialogDescription>
            Select a date for the meeting
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            className="rounded-md border"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={!date}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}