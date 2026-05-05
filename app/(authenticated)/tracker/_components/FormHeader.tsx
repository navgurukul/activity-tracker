import { CardDescription, CardTitle } from "@/components/ui/card";
import { LifelinesCard } from "./LifelinesCard";

interface FormHeaderProps {
  backfillRemaining: number;
}

export function FormHeader({ backfillRemaining }: FormHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      {/* Title & Description */}
      <div>
        <CardTitle className="text-2xl mb-2">Activity Logger</CardTitle>
        <CardDescription className="text-muted-foreground">
          Log your daily activities and manage your time effectively.
        </CardDescription>
      </div>

      {/* Lifelines Card */}
      <LifelinesCard remaining={backfillRemaining} />
    </div>
  );
}
