"use client";

import { CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { LifelinesCardProps } from "@/lib/tracker-types";

export function LifelinesCard({ remaining }: LifelinesCardProps) {
  return (
    <div
      className={cn(
        "w-full sm:w-auto min-w-[170px] bg-background border border-border rounded-lg p-3 border-l-4",
        remaining > 0 ? "border-l-[#748074]" : "border-l-amber-400"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Lifelines
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full border border-border text-muted-foreground hover:text-foreground"
                aria-label="Lifelines information"
              >
                <CircleHelp className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="w-72 max-w-[calc(100vw-2rem)] whitespace-normal break-words text-xs leading-relaxed text-left"
              side="top"
              align="end"
            >
              You're expected to submit timesheets daily. Lifelines allow you to add missed entries for up to 3 past working days. You can use up to 3 lifelines per cycle. This card shows how many lifelines you have remaining in the current cycle.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
        {remaining}
      </p>
    </div>
  );
}
