import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";

const LIFELINES_INFO = `You're expected to submit timesheets daily. Lifelines allow you to add missed entries for up to 3 past working days. You can use up to 3 lifelines per cycle. This card shows how many lifelines you have remaining in the current cycle.`;

export function LifelinesInfoButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-5 w-5 rounded-full",
              "text-muted-foreground hover:text-foreground",
              "transition-colors"
            )}
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
          {LIFELINES_INFO}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
