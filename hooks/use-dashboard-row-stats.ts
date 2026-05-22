"use client";

import { useMemo } from "react";
import { parseISO, isValid } from "date-fns";
import { TimesheetRow } from "@/lib/dashboard-type";

export const useDashboardRowStats = (timesheetRows: TimesheetRow[]) => {
  const dailyTotals = useMemo(() => {
    const map = new Map<string, number>();
    timesheetRows.forEach((row) => {
      if (row.isLeave) return;
      map.set(row.date, (map.get(row.date) ?? 0) + row.hours);
    });
    return map;
  }, [timesheetRows]);

  const dateCreatedAtMap = useMemo(() => {
    const map = new Map<string, string>();

    timesheetRows.forEach((row) => {
      if (!row.createdAt) return;

      const existing = map.get(row.date);
      if (!existing) {
        map.set(row.date, row.createdAt);
        return;
      }

      const existingDate = parseISO(existing);
      const currentDate = parseISO(row.createdAt);
      if (
        isValid(currentDate) &&
        (!isValid(existingDate) || currentDate.getTime() > existingDate.getTime())
      ) {
        map.set(row.date, row.createdAt);
      }
    });

    return map;
  }, [timesheetRows]);

  return {
    dailyTotals,
    dateCreatedAtMap,
  };
};
