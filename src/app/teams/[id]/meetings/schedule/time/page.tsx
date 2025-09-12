"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2, Calendar, Clock, Video, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { TimePicker } from "@/components/ui/time-picker"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startTime: z.date({
    required_error: "Start time is required",
  }),
  endTime: z.date({
    required_error: "End time is required",
  }),
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"],
})

type FormValues = z.infer<typeof formSchema>

export default function ScheduleMeetingTimePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [date, setDate] = useState<Date | null>(null)
  const teamId = searchParams.get('teamId')
  const selectedDate = searchParams.get('date')

  useEffect(() => {
    if (selectedDate) {
      setDate(new Date(selectedDate))
    }
  }, [selectedDate])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      startTime: date ? new Date(date.setHours(9, 0, 0, 0)) : new Date(),
      endTime: date ? new Date(date.setHours(10, 0, 0, 0)) : new Date(),
    },
  })

  useEffect(() => {
    if (date) {
      form.setValue("startTime", new Date(date.setHours(9, 0, 0, 0)))
      form.setValue("endTime", new Date(date.setHours(10, 0, 0, 0)))
    }
  }, [date, form])

  async function onSubmit(values: FormValues) {
    if (!teamId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          startTime: values.startTime.toISOString(),
          endTime: values.endTime.toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to schedule meeting")
      }

      const meetingData = await response.json()
      console.log("Meeting created:", meetingData)

      toast({
        title: "Meeting scheduled",
        description: "Your meeting has been scheduled successfully with Google Meet link.",
      })

      // Send notifications to team members
      await fetch(`/api/teams/${teamId}/meetings/${meetingData.id}/notify`, {
        method: "POST",
      })

      router.push(`/teams/${teamId}`)
    } catch (error) {
      console.error("Error scheduling meeting:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule meeting",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!date) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>No date selected</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Schedule Meeting
            </CardTitle>
          </div>
          <CardDescription>
            Schedule a meeting for {format(date, "PPP")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Team standup" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Weekly team standup meeting"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <TimePicker date={field.value} setDate={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <TimePicker date={field.value} setDate={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    "Schedule Meeting"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}