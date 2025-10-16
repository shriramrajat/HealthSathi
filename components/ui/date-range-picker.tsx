'use client'

import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DatePickerWithRangeProps {
  value?: { start: Date; end: Date } | null
  onChange?: (range: { start: Date; end: Date } | null) => void
  className?: string
  placeholder?: string
}

export function DatePickerWithRange({
  value,
  onChange,
  className,
  placeholder = "Pick a date range"
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
    from: value?.start,
    to: value?.end,
  })

  React.useEffect(() => {
    setDate({
      from: value?.start,
      to: value?.end,
    })
  }, [value])

  const handleSelect = (selectedDate: { from: Date | undefined; to: Date | undefined } | undefined) => {
    setDate(selectedDate || { from: undefined, to: undefined })
    
    if (selectedDate?.from && selectedDate?.to) {
      onChange?.({ start: selectedDate.from, end: selectedDate.to })
    } else {
      onChange?.(null)
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}