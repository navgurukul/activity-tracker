

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { format, parseISO, getYear, getMonth } from "date-fns";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/layout/AppHeader";
import { PageWrapper } from "@/components/layout/wrapper";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityEntryCard, EmptyActivityState } from "./_components";
import type { TimesheetEntry, LeaveEntry } from "./_components";
import apiClient from "@/lib/api-client";
import { API_PATHS, DATE_FORMATS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

// TypeScript interfaces for API response
interface DayData {
  date: string;
  isWorkingDay: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  timesheet: {
    id: number;
    state: string;
    totalHours: number;
    notes: string;
    entries: TimesheetEntry[];
  } | null;
  leaves: {
    totalHours: number;
    entries: LeaveEntry[];
  } | null;
}

interface MonthlyTimesheetResponse {
  user: {
    id: number;
    name: string;
    departmentId: number;
  };
  period: {
    year: number;
    month: number;
    start: string;
    end: string;
  };
  totals: {
    timesheetHours: number;
    leaveHours: number;
  };
  days: DayData[];
}

export default function DashboardPage() {
  const { isLoading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [monthlyData, setMonthlyData] =
    useState<MonthlyTimesheetResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch monthly timesheet data
  useEffect(() => {
    if (authLoading) return;

    const fetchMonthlyData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const year = getYear(currentMonth);
        const month = getMonth(currentMonth) + 1; // getMonth is 0-indexed

        const response = await apiClient.get(API_PATHS.MONTHLY_TIMESHEET, {
          params: {
            year,
            month,
          },
        });

        setMonthlyData(response.data);
      } catch (err: unknown) {
        console.error("Error fetching monthly data:", err);
        const error = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load monthly data";
        setError(errorMessage);
        toast.error("Failed to load activities", {
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthlyData();
  }, [currentMonth, authLoading]);

  // Get days with activities/leaves for calendar highlighting
  const daysWithData = useMemo(() => {
    if (!monthlyData) return [];
    return monthlyData.days
      .filter((day) => day.timesheet !== null || day.leaves !== null)
      .map((day) => parseISO(day.date));
  }, [monthlyData]);

  // Get days with only leave entries (no timesheet entries)
  const daysWithOnlyLeave = useMemo(() => {
    if (!monthlyData) return [];
    return monthlyData.days
      .filter((day) => day.leaves !== null && day.timesheet === null)
      .map((day) => parseISO(day.date));
  }, [monthlyData]);

  // Get data for selected date
  const selectedDayData = useMemo(() => {
    if (!monthlyData) return null;
    const dateKey = format(selectedDate, DATE_FORMATS.API);
    return monthlyData.days.find((day) => day.date === dateKey) || null;
  }, [selectedDate, monthlyData]);

  // Calculate total hours and entries for selected day
  const selectedDayStats = useMemo(() => {
    if (!selectedDayData) return { totalHours: 0, totalEntries: 0 };

    const timesheetHours = selectedDayData.timesheet?.totalHours || 0;
    const timesheetEntries = selectedDayData.timesheet?.entries.length || 0;

    return {
      totalHours: timesheetHours,
      totalEntries: timesheetEntries,
    };
  }, [selectedDayData]);

  // Custom modifiers for calendar
  const modifiers = useMemo(
    () => ({
      hasData: daysWithData,
      hasOnlyLeave: daysWithOnlyLeave,
      weekend:
        monthlyData?.days
          .filter((d) => d.isWeekend)
          .map((d) => parseISO(d.date)) || [],
      holiday:
        monthlyData?.days
          .filter((d) => d.isHoliday)
          .map((d) => parseISO(d.date)) || [],
    }),
    [daysWithData, daysWithOnlyLeave, monthlyData]
  );

  // Calculate if selected date is in the future
  const isFutureDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected > today;
  }, [selectedDate]);

  // Check if activity can be added (not future, and within last 3 days)
  const canAddActivity = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    // Calculate difference in days
    const diffTime = today.getTime() - selected.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Can add if: not future AND within last 3 days (0-3 days ago)
    return !isFutureDate && diffDays <= 3;
  }, [selectedDate, isFutureDate]);

  // Check if selected date is a non-working day (Sunday or 2nd/4th Saturday)
  // Leaves cannot be added for non-working days
  const isNonWorkingDay = useMemo(() => {
    const day = selectedDate.getDay();

    // Sunday
    if (day === 0) return true;

    // Check for 2nd or 4th Saturday
    if (day === 6) {
      const date = selectedDate.getDate();
      const weekOfMonth = Math.ceil(date / 7);
      // 2nd Saturday (week 2) or 4th Saturday (week 4)
      if (weekOfMonth === 2 || weekOfMonth === 4) {
        return true;
      }
    }

    return false;
  }, [selectedDate]);

  const modifiersClassNames = {
    hasData:
      "bg-main/20 font-semibold hover:bg-main/30 text-foreground relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-main",
    hasOnlyLeave:
      "bg-main/20 font-semibold hover:bg-main/30 text-foreground relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-subtle-foreground",
    weekend: "text-muted-foreground",
    holiday: "bg-red-50 dark:bg-red-950/20",
  };

  return (
    <>
      <AppHeader crumbs={[{ label: "Dashboard" }]} />
      <PageWrapper>
        <div className="flex w-full justify-center p-4">
          <div className="w-full max-w-7xl space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Hours Tracked
                    </p>
                    <p className="text-3xl font-bold">
                      {monthlyData?.totals.timesheetHours || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(currentMonth, "MMMM yyyy")}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Leave Hours
                    </p>
                    <p className="text-3xl font-bold">
                      {monthlyData?.totals.leaveHours || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(currentMonth, "MMMM yyyy")}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Hours
                    </p>
                    <p className="text-3xl font-bold">
                      {(monthlyData?.totals.timesheetHours || 0) +
                        (monthlyData?.totals.leaveHours || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Combined</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content: Details (Left) and Calendar (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Details Section - Left */}
              <Card className="lg:order-1">
                <CardHeader>
                  <CardTitle className="text-xl">Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  {error ? (
                    <div className="text-center py-8">
                      <p className="text-destructive mb-4">{error}</p>
                      <Button
                        onClick={() => setCurrentMonth(new Date(currentMonth))}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        disabled={isLoading}
                        modifiers={modifiers}
                        modifiersClassNames={modifiersClassNames}
                        className="rounded-base border-2 border-border"
                        classNames={{
                          day_selected: "bg-subtle text-foreground hover:bg-subtle-foreground hover:text-foreground focus:bg-subtle focus:text-foreground border-2 border-border"
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Calendar Section - Right */}
              <Card className="lg:order-2">
                <CardHeader>
                  <div>
                    <CardTitle className="text-xl">
                      Activities for{" "}
                      {format(selectedDate, DATE_FORMATS.DISPLAY)}
                    </CardTitle>
                    {selectedDayStats.totalEntries > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedDayStats.totalHours} hours across{" "}
                        {selectedDayStats.totalEntries}{" "}
                        {selectedDayStats.totalEntries === 1
                          ? "entry"
                          : "entries"}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto pb-2">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-32 bg-muted animate-pulse rounded-base"
                        />
                      ))}
                    </div>
                  ) : !selectedDayData ||
                    (selectedDayData.timesheet === null &&
                      selectedDayData.leaves === null) ? (
                    <EmptyActivityState
                      variant="date"
                      canAddActivity={canAddActivity}
                      canAddLeave={!isNonWorkingDay && !isFutureDate}
                    />
                  ) : (
                    <div className="space-y-4">
                      {/* Timesheet Entries */}
                      {selectedDayData.timesheet?.entries.map((entry) => (
                        <ActivityEntryCard
                          key={entry.id}
                          type="timesheet"
                          entry={entry}
                        />
                      ))}

                      {/* Leave Entries */}
                      {selectedDayData.leaves?.entries.map((entry, idx) => (
                        <ActivityEntryCard
                          key={`leave-${entry.requestId}-${idx}`}
                          type="leave"
                          entry={entry}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}

