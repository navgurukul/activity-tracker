/**
 * LoadingState Component
 * Displays a loading spinner with message
 */

import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex items-center justify-center h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    </div>
  );
}
