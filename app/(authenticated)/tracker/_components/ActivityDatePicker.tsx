import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DATE_FORMATS } from "@/lib/constants";
import { ControllerRenderProps } from "react-hook-form";

interface ActivityDatePickerProps {
  field: ControllerRenderProps<any, any>;
  disableInvalidDates: (date: Date) => boolean;
  backfillRemaining: number;
}

export function ActivityDatePicker({
  field,
  disableInvalidDates,
  backfillRemaining,
}: ActivityDatePickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <FormItem className="flex flex-col">
      <FormLabel>Activity Date</FormLabel>
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="noShadow"
              className={cn(
                "w-full md:w-[280px] justify-start text-left font-normal",
                !field.value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {field.value ? (
                format(field.value, DATE_FORMATS.DISPLAY)
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto border-0! p-0" align="start">
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={(date) => {
              if (!date) return;
              field.onChange(date);
              setCalendarOpen(false);
            }}
            disabled={disableInvalidDates}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <FormDescription>
        {backfillRemaining > 0
          ? "You can submit an entry for today, or for any of the past 3 working days within the current salary cycle, if you have lifelines remaining."
          : "Only today's date can be selected for tracking activities. Your backfill limit has been reached."}
      </FormDescription>
      <FormMessage />
    </FormItem>
  );
}
