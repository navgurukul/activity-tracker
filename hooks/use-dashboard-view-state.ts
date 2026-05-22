"use client";

import { useEffect, useState } from "react";
import { TimesheetRow } from "@/lib/dashboard-type";

interface DashboardRouter {
  replace: (href: string, options?: { scroll?: boolean }) => void;
}

interface UseDashboardViewStateParams {
  userId?: string | number | null;
  targetDateParam: string | null;
  timesheetRows: TimesheetRow[];
  isLoading: boolean;
  router: DashboardRouter;
}
export const useDashboardViewState = ({
  userId,
  targetDateParam,
  timesheetRows,
  isLoading,
  router,
}: UseDashboardViewStateParams) => {
  const [viewMode, setViewMode] = useState<"table" | "grid">(() => {
    if (typeof window === "undefined") return "table";

    const key = userId
      ? `timesheet-view-mode-${userId}`
      : "timesheet-view-mode";
    const saved = localStorage.getItem(key);
    return saved === "table" || saved === "grid" ? saved : "table";
  });

  const [highlightedDateApi, setHighlightedDateApi] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = userId
      ? `timesheet-view-mode-${userId}`
      : "timesheet-view-mode";
    localStorage.setItem(key, viewMode);
  }, [userId, viewMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (userId) {
      const key = `timesheet-view-mode-${userId}`;
      const saved = localStorage.getItem(key);
      if (saved === "table" || saved === "grid") {
        setViewMode(saved);
      } else {
        setViewMode("table");
      }
    }
  }, [userId]);

  useEffect(() => {
    if (!targetDateParam) return;
    setViewMode("table");
    setHighlightedDateApi(targetDateParam);
  }, [targetDateParam]);

  useEffect(() => {
    if (!highlightedDateApi || isLoading) return;

    const hasTargetRow = timesheetRows.some(
      (row) => row.dateApi === highlightedDateApi
    );
    if (!hasTargetRow) return;

    const targetRow = document.querySelector<HTMLElement>(
      `[data-date-api='${highlightedDateApi}']`
    );
    if (!targetRow) return;

    targetRow.scrollIntoView({ behavior: "smooth", block: "center" });

    if (targetDateParam) {
      router.replace("/", { scroll: false });
    }

    const clearHighlightTimer = window.setTimeout(() => {
      setHighlightedDateApi(null);
    }, 3000);

    return () => window.clearTimeout(clearHighlightTimer);
  }, [highlightedDateApi, isLoading, timesheetRows, router, targetDateParam]);

  return {
    viewMode,
    setViewMode,
    highlightedDateApi,
  };
};
