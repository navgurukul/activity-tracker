"use client";

import { AppHeader } from "@/app/_components/AppHeader";

export default function LeaveApplicationPage() {
  return (
    <>
      <AppHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Leave Application" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="rounded-base bg-background/50 border-2 border-border p-6">
          <h1 className="text-2xl font-heading mb-4">Leave Application</h1>
          <p className="text-muted-foreground mb-6">
            Submit your leave request by filling out the form below.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="aspect-video rounded-base bg-background border-2 border-border flex items-center justify-center">
              <span className="text-muted-foreground">
                Leave Type Selection
              </span>
            </div>
            <div className="aspect-video rounded-base bg-background border-2 border-border flex items-center justify-center">
              <span className="text-muted-foreground">Date Range Picker</span>
            </div>
          </div>
        </div>
        <div className="min-h-[50vh] rounded-base bg-background/50 border-2 border-border p-6">
          <h2 className="text-lg font-heading mb-2">Leave Details Form</h2>
          <p className="text-sm text-muted-foreground">
            Additional form fields will be implemented here.
          </p>
        </div>
      </div>
    </>
  );
}
