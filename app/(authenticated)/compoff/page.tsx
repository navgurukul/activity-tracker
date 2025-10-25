"use client";

import { AppHeader } from "@/app/_components/AppHeader";

export default function CompOffPage() {
  return (
    <>
      <AppHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Comp-Off Request" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="rounded-base bg-background/50 border-2 border-border p-6">
          <h1 className="text-2xl font-heading mb-4">Comp-Off Request</h1>
          <p className="text-muted-foreground mb-6">
            Request compensatory time off for overtime work performed.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="aspect-video rounded-base bg-background border-2 border-border flex items-center justify-center">
              <span className="text-muted-foreground">
                Overtime Date Selection
              </span>
            </div>
            <div className="aspect-video rounded-base bg-background border-2 border-border flex items-center justify-center">
              <span className="text-muted-foreground">
                Comp-Off Date Selection
              </span>
            </div>
          </div>
        </div>
        <div className="min-h-[50vh] rounded-base bg-background/50 border-2 border-border p-6">
          <h2 className="text-lg font-heading mb-4">
            Pending Comp-Off Requests
          </h2>
          <div className="space-y-2">
            <div className="rounded-base bg-background border-2 border-border p-4">
              <span className="text-sm text-muted-foreground">
                Sample pending request 1
              </span>
            </div>
            <div className="rounded-base bg-background border-2 border-border p-4">
              <span className="text-sm text-muted-foreground">
                Sample pending request 2
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
