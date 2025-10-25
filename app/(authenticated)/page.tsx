"use client";

import { AppHeader } from "@/app/_components/AppHeader";

export default function Page() {
  return (
    <>
      <AppHeader crumbs={[{ label: "Dashboard" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="aspect-video rounded-base bg-background/50 border-2 border-border" />
          <div className="aspect-video rounded-base bg-background/50 border-2 border-border" />
          <div className="aspect-video rounded-base bg-background/50 border-2 border-border" />
        </div>
        <div className="min-h-screen flex-1 rounded-base bg-background/50 border-2 border-border md:min-h-min" />
      </div>
    </>
  );
}
