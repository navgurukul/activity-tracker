"use client";

import { AppHeader } from "@/app/_components/AppHeader";

export default function LeaveHistoryPage() {
  return (
    <>
      <AppHeader
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Leave History" }]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="rounded-base bg-background/50 border-2 border-border p-6">
          <h1 className="text-2xl font-heading mb-4">Leave History</h1>
          <p className="text-muted-foreground mb-6">
            View and manage your historical leave requests and their status.
          </p>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 rounded-base bg-background border-2 border-border p-4">
              <span className="text-sm text-muted-foreground">
                Filter Options
              </span>
            </div>
            <div className="flex-1 rounded-base bg-background border-2 border-border p-4">
              <span className="text-sm text-muted-foreground">Search Bar</span>
            </div>
          </div>
        </div>
        <div className="min-h-[60vh] rounded-base bg-background/50 border-2 border-border p-6">
          <h2 className="text-lg font-heading mb-4">Leave Records Table</h2>
          <div className="space-y-2">
            <div className="rounded-base bg-background border-2 border-border p-4">
              <span className="text-sm text-muted-foreground">
                Table header row
              </span>
            </div>
            <div className="rounded-base bg-background border-2 border-border p-4">
              <span className="text-sm text-muted-foreground">
                Sample leave record 1
              </span>
            </div>
            <div className="rounded-base bg-background border-2 border-border p-4">
              <span className="text-sm text-muted-foreground">
                Sample leave record 2
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
