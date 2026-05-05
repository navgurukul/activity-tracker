import { cn } from "@/lib/utils";
import { LifelinesInfoButton } from "./LifelinesInfoButton";

interface LifelinesCardProps {
  remaining: number;
}

export function LifelinesCard({ remaining }: LifelinesCardProps) {
  return (
    <div
      className={cn(
        "w-full sm:w-auto min-w-[170px]",
        "bg-background border border-border rounded-lg p-3 border-l-4",
        remaining > 0 ? "border-l-[#748074]" : "border-l-amber-400"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Lifelines
        </span>
        <LifelinesInfoButton />
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
        {remaining}
      </p>
    </div>
  );
}
