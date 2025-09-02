"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  date: Date | undefined
  setDate: (date: Date) => void
}

export function TimePicker({ date, setDate }: TimePickerProps) {
  const [selectedHour, setSelectedHour] = React.useState(
    date ? date.getHours() : new Date().getHours()
  )
  const [selectedMinute, setSelectedMinute] = React.useState(
    date ? date.getMinutes() : new Date().getMinutes()
  )
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    if (date) {
      setSelectedHour(date.getHours())
      setSelectedMinute(date.getMinutes())
    }
  }, [date])

  const handleHourChange = (hour: number) => {
    const newDate = new Date(date || new Date())
    newDate.setHours(hour)
    setDate(newDate)
    setSelectedHour(hour)
  }

  const handleMinuteChange = (minute: number) => {
    const newDate = new Date(date || new Date())
    newDate.setMinutes(minute)
    setDate(newDate)
    setSelectedMinute(minute)
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className="flex items-center gap-1">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-16 justify-center text-center font-normal"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Clock className="mr-1 h-4 w-4" />
            {selectedHour.toString().padStart(2, "0")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" onInteractOutside={() => setIsOpen(false)}>
          <div className="grid grid-cols-4 gap-1">
            {hours.map((hour) => (
              <Button
                key={hour}
                variant={selectedHour === hour ? "default" : "ghost"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleHourChange(hour)
                }}
              >
                {hour.toString().padStart(2, "0")}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <span>:</span>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-16 justify-center text-center font-normal"
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedMinute.toString().padStart(2, "0")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" onInteractOutside={() => setIsOpen(false)}>
          <div className="grid grid-cols-4 gap-1">
            {minutes.map((minute) => (
              <Button
                key={minute}
                variant={selectedMinute === minute ? "default" : "ghost"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMinuteChange(minute)
                }}
              >
                {minute.toString().padStart(2, "0")}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}