"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileDown,
  LayoutGrid,
  List,
  Plus,
  Calendar,
  Clock,
  Check,
  X,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn, getISTBusinessDate } from "@/lib/utils";

import { AppHeader } from "@/app/_components/AppHeader";
import { PageWrapper } from "@/app/_components/wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  SearchCombobox,
  SearchComboboxOption,
} from "@/components/ui/search-combobox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import apiClient from "@/lib/api-client";
import { API_PATHS, DATE_FORMATS, VALIDATION } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  addDays,
  differenceInCalendarDays,
} from "date-fns";

// TypeScript interfaces for API response
interface TimesheetEntry {
  id?: number | string;
  entryId?: number | string;
  projectId?: number;
  departmentId?: number;
  departmentName: string;
  projectName?: string;
  taskDescription: string;
  hours: number;
  createdAt?: string;
}

interface LeaveEntry {
  leaveType: {
    name: string;
    code?: string;
  };
  hours: number;
  state?: string;
  durationType?: string;
  halfDaySegment?: string;
  reason?: string;
}

interface DayData {
  date: string;
  isWorkingDay: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  timesheet: {
    id: number;
    state: string;
    totalHours: number;
    notes: string;
    createdAt?: string;
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
    totalPayableDays: number;
  };
  days: DayData[];
}

// Flattened row for table display
interface TimesheetRow {
  sno: number;
  department?: string;
  departmentId?: number;
  project: string;
  activities: string;
  date: string;
  day: string;
  hours: number;
  hoursDisplay?: string;
  isLeave: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  leaveStatus?: "approved" | "pending" | "rejected";
  timesheetState?: string;
  entryId?: number | string;
  projectId?: number;
  dateApi?: string;
  createdAt?: string;
}
interface ProjectOption {
  id: number;
  name: string;
}

interface DepartmentOption {
  id: number;
  name: string;
  code: string;
}

type TeamVisibilityScope = "my_reportees" | "all_org";

const toDisplayLabel = (value?: string) => {
  if (!value) return "-";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatCreatedAt = (value?: string | null) => {
  if (!value) return "-";
  const parsed = parseISO(value);
  if (!isValid(parsed)) return value;
  return format(parsed, "dd/MM/yyyy HH:mm");
};

type ProjectPillTone = "green" | "yellow" | "red" | "khaki";
const getProjectPillClassName = (tone: ProjectPillTone) => {
  return cn("dashboard-status-pill", {
    "dashboard-status-pill--green": tone === "green",
    "dashboard-status-pill--yellow": tone === "yellow",
    "dashboard-status-pill--red": tone === "red",
    "dashboard-status-pill--khaki": tone === "khaki",
  });
};
const getProjectPill = (row: TimesheetRow) => {
  if (row.isLeave) {
    return {
      label: row.project,
      tone: row.leaveStatus === "rejected"
        ? "red"
        : row.leaveStatus === "pending"
          ? "yellow"
          : "green",
    } as const;
  }

  if (row.isHoliday) {
    return { label: "Public Holiday", tone: "green" } as const;
  }

  if (row.isWeekend) {
    return { label: "Off Day", tone: "green" } as const;
  }

  if (row.activities === "-") {
    return { label: "No Entries", tone: "khaki" } as const;
  }
  return null;
};

/**
 * Minimal in-file TimesheetTable component to satisfy imports and typing.
 * This keeps the DashboardPage working when the external module is missing.
 */
type TimesheetTableProps = {
  user: any;
  monthlyData: MonthlyTimesheetResponse | null;
  timesheetRows: TimesheetRow[];
  isLoading: boolean;
  error: string | null;
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onRetry: () => void;
};

export const TimesheetTable: React.FC<TimesheetTableProps> = ({
  user,
  monthlyData,
  timesheetRows,
  isLoading,
  error,
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div>Loading timesheet...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-red-600">Error: {error}</div>
          <button onClick={onRetry} className="mt-2 underline cursor-pointer">
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <button onClick={onPreviousMonth} className="mr-2 cursor-pointer">
              Previous
            </button>
            <button onClick={onNextMonth} className="cursor-pointer">
              Next
            </button>
          </div>
          <div className="text-sm">{format(currentMonth, "MMMM yyyy")}</div>
        </div>

        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Date</TableHead>
                <TableHead className="text-left">Day</TableHead>
                <TableHead className="text-left">Project</TableHead>
                <TableHead className="text-left">Activity</TableHead>
                <TableHead className="text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheetRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-4 text-center text-muted-foreground"
                  >
                    No records for this month.
                  </TableCell>
                </TableRow>
              ) : (
                timesheetRows.map((r) => (
                  <TableRow key={r.sno}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.day}</TableCell>
                    <TableCell>{r.project}</TableCell>
                    <TableCell>{r.activities}</TableCell>
                    <TableCell className="text-right">{r.hours}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading: authLoading, user } = useAuth();
  const targetDateParam = searchParams.get("date");
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const today = new Date();
    const cycleStartsOn = 26;
    let cycleStart = new Date(today);
    if (today.getDate() < cycleStartsOn) {
      cycleStart.setMonth(today.getMonth() - 1);
    }
    cycleStart.setDate(cycleStartsOn);
    cycleStart.setHours(0, 0, 0, 0);
    return cycleStart;
  });
  // Separate state for employee salary cycle when viewing team members
  const [employeeCurrentMonth, setEmployeeCurrentMonth] = useState<Date>(() => {
    const today = new Date();
    const cycleStartsOn = 26;
    let cycleStart = new Date(today);
    if (today.getDate() < cycleStartsOn) {
      cycleStart.setMonth(today.getMonth() - 1);
    }
    cycleStart.setDate(cycleStartsOn);
    cycleStart.setHours(0, 0, 0, 0);
    return cycleStart;
  });
  const [monthlyData, setMonthlyData] =
    useState<MonthlyTimesheetResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">(() => {
    if (typeof window !== "undefined") {
      const userRaw = localStorage.getItem("current-user-id");
      const userId = userRaw || undefined;
      const key = userId ? `timesheet-view-mode-${userId}` : "timesheet-view-mode";
      const saved = localStorage.getItem(key);
      if (saved === "table" || saved === "grid") return saved;
    }
    return "table";
  });

  // When user changes (login/logout), update viewMode from user-specific key
  useEffect(() => {
    if (typeof window !== "undefined" && user?.id) {
      const key = `timesheet-view-mode-${user.id}`;
      const saved = localStorage.getItem(key);
      if (saved === "table" || saved === "grid") {
        setViewMode(saved);
      } else {
        setViewMode("table");
      }
    }
  }, [user?.id]);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
  const [highlightedDateApi, setHighlightedDateApi] = useState<string | null>(
    null
  );
  const hasAutoScrolledToDateRef = useRef(false);

  // Team dashboard / search (admin/super admin/manager)
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [teamVisibilityScope, setTeamVisibilityScope] =
    useState<TeamVisibilityScope>("my_reportees");
  const [teamSearch, setTeamSearch] = useState("");
  const [teamSearchLoading, setTeamSearchLoading] = useState(false);
  const [teamSearchError, setTeamSearchError] = useState<string | null>(null);
  const [teamUser, setTeamUser] = useState<any | null>(null);

  // Restore from browser history on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const state = window.history.state || {};
    if (state.__teamDashboard) {
      setIsTeamMode(!!state.__teamDashboard.isTeamMode);
      const storedScope = state.__teamDashboard.teamVisibilityScope;
      if (storedScope === "all_org" || storedScope === "my_reportees") {
        setTeamVisibilityScope(storedScope);
      }
      setTeamSearch(state.__teamDashboard.teamSearch || "");
      setTeamUser(state.__teamDashboard.teamUser || null);
    }
  }, []);

  // Store current user id in localStorage for preference keying
  useEffect(() => {
    if (typeof window !== "undefined" && user?.id) {
      localStorage.setItem("current-user-id", String(user.id));
    }
  }, [user?.id]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({
    departmentId: "",
    project: "",
    projectId: "",
    date: "",
    hours: "",
    activities: "",
  });
  const [savingRowKey, setSavingRowKey] = useState<string | null>(null);
  const [deletingRowKey, setDeletingRowKey] = useState<string | null>(null);
  const [confirmDeleteRowKey, setConfirmDeleteRowKey] = useState<string | null>(null);
  const [activeCalendarCreatedAtKey, setActiveCalendarCreatedAtKey] = useState<string | null>(null);
  const [teamProjects, setTeamProjects] = useState<ProjectOption[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [isEditingLifeline, setIsEditingLifeline] = useState(false);
  const [lifelineDraft, setLifelineDraft] = useState("");
  const [isSavingLifeline, setIsSavingLifeline] = useState(false);
  const [isTeamLoggerOpen, setIsTeamLoggerOpen] = useState(false);
  const [isSubmittingTeamLogger, setIsSubmittingTeamLogger] = useState(false);
  const [teamDepartments, setTeamDepartments] = useState<DepartmentOption[]>([]);
  const [teamProjectsByDepartment, setTeamProjectsByDepartment] = useState<
    Record<string, ProjectOption[]>
  >({});

  const getEarliestTrackableDate = useCallback(() => {
    const today = getISTBusinessDate();
    today.setHours(0, 0, 0, 0);

    const backfillRemaining = Number(user?.backfill?.remaining ?? 0);
    if (backfillRemaining <= 0) {
      return today;
    }

    const workDaysNeeded = 3;
    const cursor = new Date(today);
    cursor.setDate(cursor.getDate() - 1);

    let found = 0;
    while (found < workDaysNeeded) {
      const dayName = format(cursor, "EEEE");
      const dayOfMonth = cursor.getDate();
      const weekOfMonth = Math.ceil(dayOfMonth / 7);
      const isSaturday = dayName === "Saturday";
      const is2ndOr4thSaturday =
        isSaturday && (weekOfMonth === 2 || weekOfMonth === 4);
      const isSunday = dayName === "Sunday";

      if (!isSunday && !is2ndOr4thSaturday) {
        found += 1;
      }

      if (found < workDaysNeeded) {
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    cursor.setHours(0, 0, 0, 0);
    return cursor;
  }, [user?.backfill?.remaining]);

  const isAddEntryEligibleDate = useCallback(
    (dateApi?: string) => {
      if (!dateApi || isTeamMode) return false;

      const targetDate = parseISO(dateApi);
      if (!isValid(targetDate)) return false;
      targetDate.setHours(0, 0, 0, 0);

      const today = getISTBusinessDate();
      today.setHours(0, 0, 0, 0);
      if (targetDate.getTime() > today.getTime()) return false;

      const earliestTrackableDate = getEarliestTrackableDate();
      return targetDate.getTime() >= earliestTrackableDate.getTime();
    },
    [getEarliestTrackableDate, isTeamMode]
  );

  const isLeaveEligibleDate = useCallback(
    (dateApi?: string) => {
      return Boolean(dateApi) && !isTeamMode;
    },
    [isTeamMode]
  );

  const openAddEntryForm = useCallback(
    (dateApi: string) => {
      setIsDaySheetOpen(false);
      router.push(`/tracker?date=${dateApi}`);
    },
    [router]
  );
  const openLeaveApplicationForm = useCallback(
    (dateApi: string) => {
      setIsDaySheetOpen(false);
      router.push(`/leaves?openNewRequest=1&date=${dateApi}`);
    },
    [router]
  );

  const renderEmptyDayActions = useCallback(
    ({
      dateApi,
      layout = "inline",
      stopPropagation = false,
      showLabel = true,
    }: {
      dateApi?: string;
      layout?: "inline" | "stack";
      stopPropagation?: boolean;
      showLabel?: boolean;
    }) => {
      if (!dateApi) {
        return showLabel
          ? <span className="text-muted-foreground">No entry</span>
          : null;
      }

      const canAddEntry = isAddEntryEligibleDate(dateApi);
      const canSubmitLeave = isLeaveEligibleDate(dateApi);

      const handleActionClick = (
        event: React.MouseEvent<HTMLButtonElement>,
        action: () => void
      ) => {
        if (stopPropagation) {
          event.stopPropagation();
        }
        action();
      };

      const actionButtons = (
        <div className={cn("flex flex-wrap gap-2", layout === "inline" && "items-center")}>
          {canAddEntry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={(event) =>
                handleActionClick(event, () => openAddEntryForm(dateApi))
              }
            >
              Add entry
            </Button>
          )}
          {canSubmitLeave && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={(event) =>
                handleActionClick(event, () => openLeaveApplicationForm(dateApi))
              }
            >
              Submit Leave
            </Button>
          )}
        </div>
      );

      if (!showLabel) {
        return actionButtons;
      }

      if (layout === "stack") {
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">No entry</p>
            {actionButtons}
          </div>
        );
      }

      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">No entry</span>
          {actionButtons}
        </div>
      );
    },
    [
      isAddEntryEligibleDate,
      isLeaveEligibleDate,
      openAddEntryForm,
      openLeaveApplicationForm,
    ]
  );
  const [teamLoggerProjectsLoading, setTeamLoggerProjectsLoading] = useState(false);
  const [teamLoggerForm, setTeamLoggerForm] = useState({
    workDate: format(new Date(), DATE_FORMATS.API),
    departmentId: "",
    projectId: "",
    hours: "",
    activities: "",
  });

  const getBillingCycleAnchorDate = (inputDate: Date) => {
    const d = new Date(inputDate);
    const cycleStartsOn = 26;
    if (d.getDate() < cycleStartsOn) {
      d.setMonth(d.getMonth() - 1);
    }

    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getResolvedUserId = (candidate: any): number | null => {
    const rawId =
      candidate?.id ?? candidate?.userId ?? candidate?.user?.id ?? null;
    const numericId = Number(rawId);
    return Number.isFinite(numericId) ? numericId : null;
  };
  const isSelfAsTeamMember = (candidate: any) => {
    const currentUserId = getResolvedUserId(user);
    const candidateUserId = getResolvedUserId(candidate);
    return (
      currentUserId !== null &&
      candidateUserId !== null &&
      currentUserId === candidateUserId
    );
  };

  // Check if user can access team dashboard
  const canAccessTeamDashboard = useMemo(() => {
    const roles = (user as any)?.roles;
    if (Array.isArray(roles)) {
      return roles.some((role) => {
        const normalizedRole = String(role).toLowerCase();
        return (
          normalizedRole === "admin" ||
          normalizedRole === "super_admin" ||
          normalizedRole === "manager"
        );
      });
    }
    if (typeof roles === "string") {
      const normalizedRole = roles.toLowerCase();
      return (
        normalizedRole === "admin" ||
        normalizedRole === "super_admin" ||
        normalizedRole === "manager"
      );
    }
    return false;
  }, [user]);

  const canEditTeamLifeline = useMemo(() => {
    const roles = (user as any)?.roles;
    if (Array.isArray(roles)) {
      return roles.some((role) => {
        const normalizedRole = String(role).toLowerCase();
        return normalizedRole === "admin" || normalizedRole === "super_admin";
      });
    }
    if (typeof roles === "string") {
      const normalizedRole = roles.toLowerCase();
      return normalizedRole === "admin" || normalizedRole === "super_admin";
    }
    return false;
  }, [user]);

  const canManageTeamEntries = canEditTeamLifeline;

  const normalizedRoleSet = useMemo(() => {
    const rawRoles = (user as any)?.roles;
    if (Array.isArray(rawRoles)) {
      return new Set(
        rawRoles
          .map((role) => String(role).toLowerCase().replace(/[_\s-]/g, ""))
          .filter(Boolean)
      );
    }
    if (typeof rawRoles === "string") {
      return new Set([rawRoles.toLowerCase().replace(/[_\s-]/g, "")]);
    }
    return new Set<string>();
  }, [user]);

  const isReportingManagerOnly = useMemo(() => {
    const hasManagerRole = normalizedRoleSet.has("manager");
    const hasElevatedRole =
      normalizedRoleSet.has("admin") || normalizedRoleSet.has("superadmin");
    return hasManagerRole && !hasElevatedRole;
  }, [normalizedRoleSet]);

  const canAccessAllOrgDashboard = useMemo(() => {
    return canAccessTeamDashboard && !isReportingManagerOnly;
  }, [canAccessTeamDashboard, isReportingManagerOnly]);

  const isReporteeScope = teamVisibilityScope === "my_reportees";

  const canAccessTeamMemberByHierarchy = useCallback(
    async (rawValue: string, scopeOverride?: TeamVisibilityScope) => {
      const normalizedValue = rawValue.trim().toLowerCase();
      if (!normalizedValue || !user?.orgId) return false;
      const effectiveScope = scopeOverride ?? teamVisibilityScope;
      const shouldRestrictToReportees =
        isReportingManagerOnly || effectiveScope === "my_reportees";

      const params: Record<string, any> = {
        orgId: user.orgId,
        q: normalizedValue,
        page: 1,
        limit: 20,
      };

      if (shouldRestrictToReportees && user?.id) {
        params.managerId = user.id;
      }

      const res = await apiClient.get(API_PATHS.EMPLOYEES, { params });
      const responseData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      const items = Array.isArray(responseData)
        ? responseData
        : responseData.data || [];

      return items.some((item: any) => {
        const email = String(item?.email ?? "").trim().toLowerCase();
        const id = Number(item?.id);
        const isNotSelf = !Number.isFinite(id) || id !== Number(user?.id);
        return email === normalizedValue && isNotSelf;
      });
    },
    [isReportingManagerOnly, teamVisibilityScope, user?.id, user?.orgId]
  );

  const fetchTeamMemberOptions = async (
    query: string
  ): Promise<SearchComboboxOption[]> => {
    if (!user?.orgId) return [];

    try {
      const params: Record<string, any> = {
        orgId: user.orgId,
        q: query,
        page: 1,
        limit: 8,
      };

      // Reporting Managers must only see direct reportees.
      if ((isReportingManagerOnly || isReporteeScope) && user?.id) {
        params.managerId = user.id;
      }

      const res = await apiClient.get(API_PATHS.EMPLOYEES, {
        params,
      });

      const responseData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      const items = Array.isArray(responseData)
        ? responseData
        : responseData.data || [];

      return items
        .filter((item: any) => {
          const itemId = Number(item?.id);
          const managerId = Number(item?.managerId);

          if (Number.isFinite(itemId) && Number(itemId) === Number(user?.id)) {
            return false;
          }

          if (
            (isReportingManagerOnly || isReporteeScope) &&
            Number.isFinite(Number(user?.id))
          ) {
            return Number.isFinite(managerId) && managerId === Number(user?.id);
          }

          return true;
        })
        .map((item: any) => ({
          value: String(item?.email ?? "").trim(),
          label: String(item?.name ?? item?.email ?? "").trim(),
          description: String(item?.email ?? "").trim(),
        }))
        .filter((item: SearchComboboxOption) => Boolean(item.value));
    } catch (err: unknown) {
      console.error("Failed to fetch team member suggestions:", err);
      return [];
    }
  };

  const searchTeamMemberByEmail = async (
    rawValue: string,
    persist = true,
    scopeOverride?: TeamVisibilityScope
  ) => {
    const normalizedValue = rawValue.trim();
    if (!normalizedValue) return;
    const effectiveScope = scopeOverride ?? teamVisibilityScope;
    const shouldRestrictToReportees =
      isReportingManagerOnly || effectiveScope === "my_reportees";

    setTeamSearch(normalizedValue);
    // Persist in browser history
    if (persist && typeof window !== "undefined") {
      const state = window.history.state || {};
      window.history.replaceState({
        ...state,
        __teamDashboard: {
          ...state.__teamDashboard,
          isTeamMode: true,
          teamVisibilityScope: effectiveScope,
          teamSearch: normalizedValue,
        },
      }, "");
    }
    setTeamSearchLoading(true);
    setTeamSearchError(null);

    try {
      if (shouldRestrictToReportees) {
        const hasAccess = await canAccessTeamMemberByHierarchy(
          normalizedValue,
          effectiveScope
        );
        if (!hasAccess) {
          setTeamUser(null);
          setMonthlyData(null);
          setTeamSearchError("You can search only your direct reportees.");
          toast.error("Access denied", {
            description: "You can search only your direct reportees.",
          });
          return;
        }
      }

      const res = await apiClient.get(API_PATHS.EMPLOYEE_SEARCH, {
        params: { email: normalizedValue },
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const data = res.data;
      const searchedUser = data?.user ?? data;

      if (isSelfAsTeamMember(searchedUser)) {
        setTeamUser(null);
        setMonthlyData(null);
        setTeamSearchError("You cannot select yourself.");
        toast.error("You cannot select yourself.");
        if (persist && typeof window !== "undefined") {
          const state = window.history.state || {};
          window.history.replaceState({
            ...state,
            __teamDashboard: {
              ...state.__teamDashboard,
              teamUser: null,
            },
          }, "");
        }
        return;
      }

      const fallbackEmail = normalizedValue;

      let normalizedTeamUser = null;
      if (data && data.days && data.user) {
        normalizedTeamUser = {
          ...data.user,
          searchedEmail: fallbackEmail,
          backfill:
            (data.user as any)?.backfill ?? (data as any)?.backfill ?? null,
        };
        setMonthlyData(data as MonthlyTimesheetResponse);
        setTeamUser(normalizedTeamUser);
        setTeamSearchError(null);
        toast.success("Team member data loaded");
      } else if (data?.user) {
        normalizedTeamUser = {
          ...data.user,
          searchedEmail: fallbackEmail,
          backfill:
            (data.user as any)?.backfill ?? (data as any)?.backfill ?? null,
        };
        setTeamUser(normalizedTeamUser);
        setTeamSearchError(null);
        toast.success("Team member selected");
      } else {
        normalizedTeamUser = {
          ...(data || {}),
          searchedEmail: fallbackEmail,
        };
        setTeamUser(normalizedTeamUser);
        setTeamSearchError(null);
        toast.success("Team member selected");
      }
      if (persist && typeof window !== "undefined" && normalizedTeamUser) {
        const state = window.history.state || {};
        window.history.replaceState({
          ...state,
          __teamDashboard: {
            ...state.__teamDashboard,
            teamUser: normalizedTeamUser,
            isTeamMode: true,
            teamVisibilityScope: effectiveScope,
          },
        }, "");
      }
    } catch (err: unknown) {
      console.error("Team search error:", err);
      setTeamSearchError("No user found");
      toast.error("Team search failed");
    } finally {
      setTeamSearchLoading(false);
    }
  };
  // Restore from browser history on mount and fetch data if needed
  useEffect(() => {
    if (isReportingManagerOnly && teamVisibilityScope === "all_org") {
      setTeamVisibilityScope("my_reportees");
    }
  }, [isReportingManagerOnly, teamVisibilityScope]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const state = window.history.state || {};
    if (state.__teamDashboard) {
      setIsTeamMode(!!state.__teamDashboard.isTeamMode);
      const storedScope = state.__teamDashboard.teamVisibilityScope;
      const resolvedScope: TeamVisibilityScope =
        storedScope === "all_org" ? "all_org" : "my_reportees";
      if (storedScope === "all_org" || storedScope === "my_reportees") {
        setTeamVisibilityScope(storedScope);
      }
      setTeamSearch(state.__teamDashboard.teamSearch || "");
      setTeamUser(state.__teamDashboard.teamUser || null);
      if (state.__teamDashboard.isTeamMode && state.__teamDashboard.teamSearch) {
        searchTeamMemberByEmail(
          state.__teamDashboard.teamSearch,
          false,
          resolvedScope
        );
      }
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const state = window.history.state || {};
    if (isTeamMode) {
      window.history.replaceState({
        ...state,
        __teamDashboard: {
          ...state.__teamDashboard,
          isTeamMode: true,
          teamVisibilityScope,
          teamUser,
          teamSearch,
        },
      }, "");
    } else {
      const { __teamDashboard, ...rest } = state;
      window.history.replaceState(rest, "");
    }
  }, [isTeamMode, teamVisibilityScope, teamUser, teamSearch]);

  useEffect(() => {
    setIsEditingLifeline(false);
    setLifelineDraft("");
    // Persist team mode and user on change
    if (typeof window !== "undefined") {
      localStorage.setItem("team-dashboard-mode", String(isTeamMode));
      localStorage.setItem("team-dashboard-scope", teamVisibilityScope);
      if (!isTeamMode) {
        localStorage.removeItem("team-dashboard-user");
        localStorage.removeItem("team-dashboard-search");
        setEmployeeCurrentMonth(() => {
          const today = new Date();
          const cycleStartsOn = 26;
          let cycleStart = new Date(today);
          if (today.getDate() < cycleStartsOn) {
            cycleStart.setMonth(today.getMonth() - 1);
          }
          cycleStart.setDate(cycleStartsOn);
          cycleStart.setHours(0, 0, 0, 0);
          return cycleStart;
        });
      }
    }
  }, [isTeamMode, teamVisibilityScope, teamUser?.id]);
  // Restore persisted team dashboard state on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const persistedMode = localStorage.getItem("team-dashboard-mode") === "true";
    const persistedUserRaw = localStorage.getItem("team-dashboard-user");
    const persistedSearch = localStorage.getItem("team-dashboard-search");
    const persistedScope = localStorage.getItem("team-dashboard-scope");
    if (persistedMode && persistedUserRaw) {
      try {
        const persistedUser = JSON.parse(persistedUserRaw);
        setIsTeamMode(true);
        if (persistedScope === "all_org" || persistedScope === "my_reportees") {
          setTeamVisibilityScope(persistedScope);
        }
        setTeamUser(persistedUser);
        if (persistedSearch) setTeamSearch(persistedSearch);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!targetDateParam || isTeamMode) return;

    const parsedDate = parseISO(targetDateParam);
    if (Number.isNaN(parsedDate.getTime())) return;

    setCurrentMonth(getBillingCycleAnchorDate(parsedDate));
    setViewMode("table");
    localStorage.setItem("timesheet-view-mode", "table");
    setHighlightedDateApi(targetDateParam);
    hasAutoScrolledToDateRef.current = false;
  }, [targetDateParam, isTeamMode]);

  // Fetch timesheet data
  useEffect(() => {
    if (authLoading) return;

    // If we're in team mode but no team user selected, clear data and skip fetch.
    if (isTeamMode && !teamUser) {
      setMonthlyData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Admin should not view their own data inside Team Dashboard mode.
    if (isTeamMode && teamUser && isSelfAsTeamMember(teamUser)) {
      setMonthlyData(null);
      setError("You cannot view your own data in Team Dashboard");
      setIsLoading(false);
      return;
    }


    if (isTeamMode && teamUser && !canManageTeamEntries) {
      setError(null);
      setIsLoading(false);
      return;
    }

    const fetchMonthlyData = async () => {
      const id = ++fetchIdRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const monthToUse = isTeamMode ? employeeCurrentMonth : currentMonth;
        const year = monthToUse.getFullYear();
        const month = monthToUse.getMonth() + 1;

        // If teamUser is selected, include their id so backend returns that user's data
        const params: Record<string, any> = { year, month };
        if (teamUser?.id) params.userId = teamUser.id;

        const response = await apiClient.get<MonthlyTimesheetResponse>(
          API_PATHS.MONTHLY_TIMESHEET,
          {
            params,
          }
        );

        if (id !== fetchIdRef.current) return;
        setMonthlyData(response.data);
      } catch (err: unknown) {
        if (id !== fetchIdRef.current) return;
        const error = err as {
          response?: { status?: number; data?: { message?: string } };
          message?: string;
        };

        if (error.response?.status === 403 && isTeamMode) {
          setError(null);
          return;
        }

        console.error("Error fetching monthly data:", err);

        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load monthly data";
        setError(errorMessage);
        toast.error("Failed to load activities", {
          description: errorMessage,
        });
      } finally {
        if (id !== fetchIdRef.current) return;
        setIsLoading(false);
      }
    };

    fetchMonthlyData();
  }, [currentMonth, employeeCurrentMonth, authLoading, isTeamMode, teamUser, refreshTick, user?.id]);
  useEffect(() => {
    if (authLoading || !user?.orgId || !canAccessTeamDashboard) return;

    const fetchProjects = async () => {
      setProjectsLoading(true);
      try {
        let page = 1;
        let hasMore = true;
        const allProjects: ProjectOption[] = [];

        while (hasMore) {
          const res = await apiClient.get(API_PATHS.PROJECTS, {
            params: { orgId: user.orgId, page, limit: 100 },
          });

          const responseData = Array.isArray(res.data)
            ? res.data
            : res.data?.data || [];
          const items = Array.isArray(responseData)
            ? responseData
            : responseData.data || [];

          const normalized = items
            .map((p: any) => ({
              id: Number(p.id),
              name: String(p.name ?? p.projectName ?? ""),
            }))
            .filter((p: ProjectOption) => Number.isFinite(p.id) && p.name);

          allProjects.push(...normalized);

          const total = Number(res.data?.total ?? normalized.length);
          hasMore = allProjects.length < total;
          page += 1;

          if (!res.data?.total) {
            hasMore = false;
          }
        }
        const unique = Array.from(
          new Map(allProjects.map((p) => [p.id, p])).values()
        );
        setTeamProjects(unique);
      } catch (err: unknown) {
        console.error("Failed to load projects for edit:", err);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, [authLoading, user?.orgId, canAccessTeamDashboard]);

  useEffect(() => {
    if (authLoading || !user?.orgId || !canAccessTeamDashboard) return;

    const fetchDepartments = async () => {
      try {
        const res = await apiClient.get(API_PATHS.DEPARTMENTS, {
          params: { orgId: user.orgId },
        });
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const normalized = list
          .map((dept: any) => ({
            id: Number(dept.id),
            name: String(dept.name ?? ""),
            code: String(dept.code ?? ""),
          }))
          .filter(
            (dept: DepartmentOption) =>
              Number.isFinite(dept.id) && Boolean(dept.name)
          );
        setTeamDepartments(normalized);
      } catch (err: unknown) {
        console.error("Failed to load departments for team logger:", err);
      }
    };

    fetchDepartments();
  }, [authLoading, user?.orgId, canAccessTeamDashboard]);
  // Flatten data into table rows
  const timesheetRows = useMemo((): TimesheetRow[] => {
    if (!monthlyData) return [];

    const rows: TimesheetRow[] = [];
    let sno = 1;
    const sortedDays = [...monthlyData.days].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedDays.forEach((day) => {
      const parsedDate = parseISO(day.date);
      const dayOfWeek = format(parsedDate, "EEEE");
      const dayOfMonth = parsedDate.getDate();
      const weekOfMonth = Math.ceil(dayOfMonth / 7);
      const isSaturday = dayOfWeek === "Saturday";
      const is2ndOr4thSaturday =
        isSaturday && (weekOfMonth === 2 || weekOfMonth === 4);
      const isSunday = dayOfWeek === "Sunday";
      const isWeekendOff = is2ndOr4thSaturday || isSunday;
      const timesheetEntries = day.timesheet?.entries ?? [];
      const timesheetDayCreatedAt = day.timesheet?.createdAt;
      const leaveEntries = day.leaves?.entries ?? [];
      const hasTimesheetEntries = timesheetEntries.length > 0;
      const hasLeaveEntries = leaveEntries.length > 0;

      // Add timesheet entries
      if (hasTimesheetEntries) {
        timesheetEntries.forEach((entry) => {
          rows.push({
            sno: sno++,
            department: entry.departmentName || "-",
            departmentId: (entry as any).departmentId,
            project: entry.projectName || "-",
            activities: entry.taskDescription || "-",
            date: format(parsedDate, "dd/MM/yyyy"),
            dateApi: format(parsedDate, DATE_FORMATS.API),
            day: dayOfWeek,
            hours: entry.hours,
            isLeave: false,
            isWeekend: isWeekendOff,
            isHoliday: day.isHoliday,
            timesheetState: day.timesheet?.state,
            entryId: (entry as any).id ?? (entry as any).entryId ?? undefined,
            projectId: (entry as any).projectId,
            createdAt: entry.createdAt ?? timesheetDayCreatedAt,
          });
        });
      }

      // Add leave entries
      if (hasLeaveEntries) {
        leaveEntries.forEach((entry) => {
          const leaveStatus =
            (entry as any).state === "rejected"
              ? "rejected"
              : (entry as any).state === "pending"
                ? "pending"
                : "approved";

          const leaveName = entry.leaveType?.name || "Leave";
          const leaveStatusLabel = toDisplayLabel(leaveStatus);

          rows.push({
            sno: sno++,
            project: `${leaveName} - ${leaveStatusLabel}`,
            activities: (entry as any).reason?.trim() || "-",
            date: format(parsedDate, "dd/MM/yyyy"),
            dateApi: format(parsedDate, DATE_FORMATS.API),
            day: dayOfWeek,
            hours: entry.hours,
            hoursDisplay: toDisplayLabel((entry as any).durationType),
            isLeave: true,
            isWeekend: isWeekendOff,
            isHoliday: day.isHoliday,
            leaveStatus: leaveStatus,
          });
        });
      }

      // Add weekend/holiday rows if no entries exist
      if (
        (isWeekendOff || day.isHoliday) &&
        !hasTimesheetEntries &&
        !hasLeaveEntries
      ) {
        let offType = "";
        if (day.isHoliday) {
          offType = day.holidayName
            ? `Holiday (${day.holidayName})`
            : "Holiday";
        } else if (isSunday) {
          offType = "Sunday";
        } else if (is2ndOr4thSaturday) {
          offType = "Saturday (Off)";
        }

        rows.push({
          sno: sno++,
          project: "-",
          activities: offType,
          date: format(parsedDate, "dd/MM/yyyy"),
          day: dayOfWeek,
          hours: 0,
          isLeave: false,
          isWeekend: isWeekendOff,
          isHoliday: day.isHoliday,
          holidayName: day.holidayName,
        });
      }
      if (!isWeekendOff && !day.isHoliday && !hasTimesheetEntries && !hasLeaveEntries) {
        rows.push({
          sno: sno++,
          project: "-",
          activities: "-",
          date: format(parsedDate, "dd/MM/yyyy"),
          dateApi: format(parsedDate, DATE_FORMATS.API),
          day: dayOfWeek,
          hours: 0,
          isLeave: false,
          isWeekend: false,
          isHoliday: false,
        });
      }
    });

    return rows;
  }, [monthlyData]);

  useEffect(() => {
    if (!highlightedDateApi || isLoading || hasAutoScrolledToDateRef.current) {
      return;
    }

    const hasTargetRow = timesheetRows.some(
      (row) => row.dateApi === highlightedDateApi
    );
    if (!hasTargetRow) return;

    const targetRow = document.querySelector<HTMLElement>(
      `[data-date-api='${highlightedDateApi}']`
    );
    if (!targetRow) return;

    targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
    hasAutoScrolledToDateRef.current = true;

    if (targetDateParam) {
      router.replace("/", { scroll: false });
    }

    const clearHighlightTimer = window.setTimeout(() => {
      setHighlightedDateApi(null);
    }, 3000);

    return () => window.clearTimeout(clearHighlightTimer);
  }, [highlightedDateApi, isLoading, timesheetRows, router, targetDateParam]);

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

  const leaveDaysDisplay = useMemo(() => {
    if (!monthlyData) return 0;
    const days = monthlyData.totals.leaveHours / 8;
    return Number.isInteger(days) ? days : Number(days.toFixed(1));
  }, [monthlyData]);

  // Add new useMemo for total cycle days
  const totalCycleDays = useMemo(() => {
    if (!monthlyData) return 0;
    const start = parseISO(monthlyData.period.start);
    const end = parseISO(monthlyData.period.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [monthlyData]);

  const payableDays = useMemo(() => {
    if (!monthlyData) return 0;
    return monthlyData.totals.totalPayableDays || 0;
  }, [monthlyData]);

  const resolvedBackfill = useMemo(() => {
    if (isTeamMode) {
      return (
        (teamUser as any)?.backfill ??
        (monthlyData as any)?.backfill ??
        (monthlyData as any)?.user?.backfill ??
        null
      );
    }
    return (user as any)?.backfill ?? null;
  }, [isTeamMode, teamUser, monthlyData, user]);

  const getTeamTargetUserId = () => {
    const teamSelectedId = Number(teamUser?.id);
    if (Number.isFinite(teamSelectedId)) return teamSelectedId;
    const fetchedUserId = Number((monthlyData as any)?.user?.id);
    if (Number.isFinite(fetchedUserId)) return fetchedUserId;
    return null;
  };

  const postBackfillLimitWithFallbackPayloads = async (
    payloads: Array<Record<string, unknown>>
  ) => {
    let lastError: unknown;
    for (const payload of payloads) {
      try {
        await apiClient.post(API_PATHS.BACKFILL_LIMIT, payload);
        return;
      } catch (err: unknown) {
        lastError = err;
        if (!isUnknownProperty400(err)) {
          throw err;
        }
      }
    }
    throw lastError;
  };

  const resetTeamLoggerForm = () => {
    setTeamLoggerForm({
      workDate: format(new Date(), DATE_FORMATS.API),
      departmentId: "",
      projectId: "",
      hours: "",
      activities: "",
    });
  };

  const fetchTeamLoggerProjectsForDepartment = async (departmentId: string) => {
    const numericDepartmentId = Number(departmentId);
    if (!user?.orgId || !Number.isFinite(numericDepartmentId)) return;

    if (teamProjectsByDepartment[departmentId]?.length) return;

    setTeamLoggerProjectsLoading(true);
    try {
      let page = 1;
      let hasMore = true;
      const allProjects: ProjectOption[] = [];

      while (hasMore) {
        const res = await apiClient.get(API_PATHS.PROJECTS, {
          params: {
            orgId: user.orgId,
            departmentId: numericDepartmentId,
            page,
            limit: 100,
          },
        });

        const responseData = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];
        const items = Array.isArray(responseData)
          ? responseData
          : responseData.data || [];

        const normalized = items
          .map((project: any) => ({
            id: Number(project.id),
            name: String(project.name ?? project.projectName ?? ""),
          }))
          .filter(
            (project: ProjectOption) =>
              Number.isFinite(project.id) && Boolean(project.name)
          );

        allProjects.push(...normalized);

        const total = Number(res.data?.total ?? normalized.length);
        hasMore = allProjects.length < total;
        page += 1;

        if (!res.data?.total) {
          hasMore = false;
        }
      }

      const unique = Array.from(
        new Map(allProjects.map((project) => [project.id, project])).values()
      );
      setTeamProjectsByDepartment((prev) => ({
        ...prev,
        [departmentId]: unique,
      }));
    } catch (err: unknown) {
      console.error("Failed to load department projects for team logger:", err);
      toast.error("Failed to load projects", {
        description: "Please try again.",
      });
    } finally {
      setTeamLoggerProjectsLoading(false);
    }
  };

  const postAdminCreateWithFallbackPayloads = async (
    payloads: Array<Record<string, unknown>>
  ) => {
    let lastError: unknown;
    for (const payload of payloads) {
      try {
        await apiClient.post(API_PATHS.TIMESHEET_ADMIN_CREATE, payload);
        return;
      } catch (err: unknown) {
        lastError = err;
        if (!isUnknownProperty400(err)) {
          throw err;
        }
      }
    }
    throw lastError;
  };

  const handleStartLifelineEdit = () => {
    if (!isTeamMode || !teamUser || !canEditTeamLifeline) return;
    const currentValue = Number(
      (teamUser as any)?.backfill?.remaining ??
      (monthlyData as any)?.backfill?.remaining ??
      0
    );
    setLifelineDraft(String(Number.isFinite(currentValue) ? currentValue : 0));
    setIsEditingLifeline(true);
  };

  const handleCancelLifelineEdit = () => {
    setIsEditingLifeline(false);
    setLifelineDraft("");
  };

  const handleSaveLifeline = async () => {
    const targetUserId = getTeamTargetUserId();
    if (!targetUserId) {
      toast.error("Unable to identify team member");
      return;
    }

    const updatedBalance = Number(lifelineDraft);
    if (!Number.isFinite(updatedBalance) || updatedBalance < 0) {
      toast.error("Invalid lifeline balance", {
        description: "Lifeline balance must be a number greater than or equal to 0.",
      });
      return;
    }

    const normalizedBalance = Math.floor(updatedBalance);
    const monthFromData = Number(monthlyData?.period?.month);
    const yearFromData = Number(monthlyData?.period?.year);
    const monthToUseForContext = isTeamMode ? employeeCurrentMonth : currentMonth;
    const requestMonth = Number.isInteger(monthFromData)
      ? monthFromData
      : monthToUseForContext.getMonth() + 1;
    const requestYear = Number.isInteger(yearFromData)
      ? yearFromData
      : monthToUseForContext.getFullYear();

    if (!Number.isInteger(requestYear) || !Number.isInteger(requestMonth)) {
      toast.error("Unable to update lifeline", {
        description: "Month/year context is missing.",
      });
      return;
    }

    const contextPayload = {
      year: requestYear,
      month: requestMonth,
    };

    const payloadsToTry: Array<Record<string, unknown>> = [
      { ...contextPayload, userId: targetUserId, remaining: normalizedBalance },
      { ...contextPayload, targetUserId, remaining: normalizedBalance },
      { ...contextPayload, employeeId: targetUserId, remaining: normalizedBalance },
      { ...contextPayload, userId: targetUserId, balance: normalizedBalance },
      { ...contextPayload, targetUserId, balance: normalizedBalance },
      { ...contextPayload, employeeId: targetUserId, balance: normalizedBalance },
      {
        ...contextPayload,
        userId: targetUserId,
        backfillBalance: normalizedBalance,
      },
      {
        ...contextPayload,
        targetUserId,
        backfillBalance: normalizedBalance,
      },
      {
        ...contextPayload,
        userId: targetUserId,
        lifelineBalance: normalizedBalance,
      },
      {
        ...contextPayload,
        targetUserId,
        lifelineBalance: normalizedBalance,
      },
    ];

    setIsSavingLifeline(true);
    try {
      await postBackfillLimitWithFallbackPayloads(payloadsToTry);
      setTeamUser((prev: any) => {
        if (!prev) return prev;

        return {
          ...prev,
          backfill: {
            ...(prev.backfill || {}),
            remaining: normalizedBalance,
          },
        };
      });
      setIsEditingLifeline(false);
      setRefreshTick((prev) => prev + 1);
      toast.success("Lifeline balance updated successfully");
    } catch (err: unknown) {
      console.error("Failed to update lifeline:", err);
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to update lifeline";
      toast.error("Lifeline balance update failed", {
        description: message,
      });
    } finally {
      setIsSavingLifeline(false);
    }
  };

  const handleSalarySummaryExport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date must be before end date");
      return;
    }

    setIsExporting(true);
    try {
      const response = await apiClient.get(API_PATHS.SALARY_SUMMARY, {
        params: {
          startDate,
          endDate,
        },
        responseType: "blob",
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `salary-summary-${startDate}-to-${endDate}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Salary summary exported successfully");
    } catch (err: unknown) {
      console.error("Error exporting salary summary:", err);
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to export salary summary";
      toast.error("Export failed", {
        description: errorMessage,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCycleToPdf = async () => {
    if (isTeamMode) {
      return;
    }
    if (!monthlyData) {
      toast.error("No monthly timesheet data available");
      return;
    }
    setIsPdfExporting(true);
    try {
      const toAscii = (value: string) => value.replace(/[^\x20-\x7E]/g, "?");
      const escapePdfText = (value: string) =>
        toAscii(value)
          .replace(/\\/g, "\\\\")
          .replace(/\(/g, "\\(")
          .replace(/\)/g, "\\)");
      const padCell = (value: string, width: number) => {
        const trimmed = value.trim();
        if (trimmed.length >= width) return `${trimmed.slice(0, width - 1)}~`;
        return `${trimmed}${" ".repeat(width - trimmed.length)}`;
      };
      const wrapText = (value: string, width: number) => {
        const text = value.trim();
        if (!text) return ["-"];
        const result: string[] = [];
        let cursor = 0;
        while (cursor < text.length) {
          result.push(text.slice(cursor, cursor + width));
          cursor += width;
        }
        return result;
      };

      const formatDate = (value: string) => {
        const parsed = parseISO(value);
        if (!isValid(parsed)) return value;
        return format(parsed, "dd/MM/yyyy");
      };

      const getCycleRows = (data: MonthlyTimesheetResponse) => {
        const rows: Array<{
          date: string;
          day: string;
          department: string;
          projectType: string;
          activity: string;
          hours: string;
          status: string;
        }> = [];

        const sortedDays = [...data.days].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        sortedDays.forEach((day) => {
          const parsedDate = parseISO(day.date);
          const dayName = isValid(parsedDate) ? format(parsedDate, "EEEE") : "-";
          const rowDate = formatDate(day.date);
          const dayOfMonth = isValid(parsedDate) ? parsedDate.getDate() : 0;
          const weekOfMonth = Math.ceil(dayOfMonth / 7);
          const isSaturday = dayName === "Saturday";
          const is2ndOr4thSaturday =
            isSaturday && (weekOfMonth === 2 || weekOfMonth === 4);
          const isSunday = dayName === "Sunday";
          const isWeekendOff = is2ndOr4thSaturday || isSunday;

          const timesheetEntries = day.timesheet?.entries ?? [];
          const leaveEntries = day.leaves?.entries ?? [];

          if (timesheetEntries.length > 0) {
            timesheetEntries.forEach((entry) => {
              rows.push({
                date: rowDate,
                day: dayName,
                department: entry.departmentName || "-",
                projectType: entry.projectName || "-",
                activity: entry.taskDescription || "-",
                hours: String(entry.hours ?? 0),
                status: toDisplayLabel(day.timesheet?.state) || "Submitted",
              });
            });
          }

          if (leaveEntries.length > 0) {
            leaveEntries.forEach((entry) => {
              const leaveType = entry.leaveType?.name || "Leave";
              const leaveStatus = toDisplayLabel(entry.state) || "Approved";
              rows.push({
                date: rowDate,
                day: dayName,
                department: "-",
                projectType: `${leaveType} (${leaveStatus})`,
                activity: entry.reason?.trim() || "-",
                hours: String(entry.hours ?? 0),
                status: leaveStatus,
              });
            });
          }

          if (
            timesheetEntries.length === 0 &&
            leaveEntries.length === 0 &&
            (isWeekendOff || day.isHoliday)
          ) {
            const activity = day.isHoliday
              ? day.holidayName
                ? `Holiday (${day.holidayName})`
                : "Holiday"
              : isSunday
                ? "Sunday"
                : "Saturday (Off)";
            rows.push({
              date: rowDate,
              day: dayName,
              department: "-",
              projectType: "-",
              activity,
              hours: "0",
              status: "Off Day",
            });
          }

          if (
            timesheetEntries.length === 0 &&
            leaveEntries.length === 0 &&
            !isWeekendOff &&
            !day.isHoliday
          ) {
            rows.push({
              date: rowDate,
              day: dayName,
              department: "-",
              projectType: "-",
              activity: "-",
              hours: "0",
              status: "Pending",
            });
          }
        });

        return rows;
      };

      const cycleRows = getCycleRows(monthlyData);
      const periodStart = formatDate(monthlyData.period.start);
      const periodEnd = formatDate(monthlyData.period.end);
      const userEmail = user?.email || "N/A";
      const contentLines: string[] = [
        "TIMESHEET - SALARY CYCLE",
        `User Email: ${userEmail}`,
        `Cycle Range: ${periodStart} - ${periodEnd}`,
        `Total Rows: ${cycleRows.length}`,
        "",
        `${padCell("S.No", 6)}${padCell("Date", 12)}${padCell("Day", 12)}${padCell("Dept", 18)}${padCell("Project/Type", 24)}${padCell("Hours", 8)}${padCell("Status", 12)}Activity`,
        "------------------------------------------------------------------------------------------------------------------------",
      ];

      cycleRows.forEach((row, index) => {
        const activityLines = wrapText(row.activity, 70);
        activityLines.forEach((activityLine, lineIndex) => {
          if (lineIndex === 0) {
            contentLines.push(
              `${padCell(String(index + 1), 6)}${padCell(row.date, 12)}${padCell(row.day, 12)}${padCell(row.department, 18)}${padCell(row.projectType, 24)}${padCell(row.hours, 8)}${padCell(row.status, 12)}${activityLine}`
            );
            return;
          }

          contentLines.push(
            `${padCell("", 6)}${padCell("", 12)}${padCell("", 12)}${padCell("", 18)}${padCell("", 24)}${padCell("", 8)}${padCell("", 12)}${activityLine}`
          );
        });
      });

      const linesPerPage = 42;
      const pages: string[][] = [];
      for (let i = 0; i < contentLines.length; i += linesPerPage) {
        pages.push(contentLines.slice(i, i + linesPerPage));
      }

      const objects: string[] = [""];
      const addObject = (content: string) => {
        objects.push(content);
        return objects.length - 1;
      };

      const catalogObjectNumber = 1;
      const pagesObjectNumber = 2;
      const fontObjectNumber = 3;

      objects[catalogObjectNumber] = "";
      objects[pagesObjectNumber] = "";
      objects[fontObjectNumber] =
        "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>";

      const pageObjectNumbers: number[] = [];

      pages.forEach((pageLines) => {
        let stream = "BT\n/F1 9 Tf\n36 560 Td\n";
        pageLines.forEach((line, index) => {
          if (index === 0) {
            stream += `(${escapePdfText(line)}) Tj\n`;
          } else {
            stream += `0 -12 Td\n(${escapePdfText(line)}) Tj\n`;
          }
        });
        stream += "ET";

        const contentObjectNumber = addObject(
          `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
        );

        const pageObjectNumber = addObject(
          `<< /Type /Page /Parent ${pagesObjectNumber} 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
        );

        pageObjectNumbers.push(pageObjectNumber);
      });

      objects[catalogObjectNumber] = `<< /Type /Catalog /Pages ${pagesObjectNumber} 0 R >>`;
      objects[pagesObjectNumber] = `<< /Type /Pages /Kids [${pageObjectNumbers
        .map((objNo) => `${objNo} 0 R`)
        .join(" ")}] /Count ${pageObjectNumbers.length} >>`;

      let pdf = "%PDF-1.4\n";
      const offsets: number[] = [0];

      for (let i = 1; i < objects.length; i += 1) {
        offsets[i] = pdf.length;
        pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
      }

      const startXref = pdf.length;
      pdf += `xref\n0 ${objects.length}\n`;
      pdf += "0000000000 65535 f \n";

      for (let i = 1; i < objects.length; i += 1) {
        pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
      }

      pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogObjectNumber} 0 R >>\n`;
      pdf += `startxref\n${startXref}\n%%EOF`;

      const blob = new Blob([pdf], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `timesheet-${periodStart}-to-${periodEnd}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Timesheet PDF downloaded successfully");
    } catch (err: unknown) {
      console.error("Error exporting timesheet PDF:", err);
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Export failed", {
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to export timesheet PDF",
      });
    } finally {
      setIsPdfExporting(false);
    }
  };

  const handlePreviousMonth = () => {
    if (isTeamMode) {
      setEmployeeCurrentMonth((prev) => subMonths(prev, 1));
    } else {
      setCurrentMonth((prev) => subMonths(prev, 1));
    }
  };

  const handleNextMonth = () => {
    if (isTeamMode) {
      setEmployeeCurrentMonth((prev) => addMonths(prev, 1));
    } else {
      setCurrentMonth((prev) => addMonths(prev, 1));
    }
  };

  const getRowKey = (row: TimesheetRow, index: number) =>
    `${row.entryId ?? "no-entry"}-${row.date}-${index}`;
  const getTeamEditContext = () => {
    const actorId = (user as any)?.id;
    const targetUserId =
      (teamUser as any)?.id ?? (monthlyData as any)?.user?.id ?? null;

    if (!actorId || !targetUserId) {
      toast.error("Unable to identify actor or team member");
      return null;
    }
    return { actorId, targetUserId };
  };
  const buildTimesheetEntryPath = (
    template: string,
    actorId: number | string,
    targetUserId: number | string,
    entryId: number | string
  ) =>
    template
      .replace("{actorId}", String(actorId))
      .replace("{targetUserId}", String(targetUserId))
      .replace("{entryId}", String(entryId));

  const handleStartEdit = (row: TimesheetRow, index: number) => {
    const rowKey = getRowKey(row, index);
    const mappedDepartmentId =
      row.departmentId ??
      teamDepartments.find(
        (d) =>
          row.department &&
          d.name.toLowerCase() === row.department.toLowerCase()
      )?.id;
    const departmentKey = mappedDepartmentId ? String(mappedDepartmentId) : "";

    if (departmentKey) {
      void fetchTeamLoggerProjectsForDepartment(departmentKey);
    }

    const departmentProjects = departmentKey
      ? teamProjectsByDepartment[departmentKey] || []
      : [];
    const mappedProjectId =
      row.projectId ??
      departmentProjects.find(
        (p) => p.name.toLowerCase() === row.project.toLowerCase()
      )?.id ??
      teamProjects.find(
        (p) => p.name.toLowerCase() === row.project.toLowerCase()
      )?.id;

    setEditingRowKey(rowKey);
    setEditingForm({
      departmentId: departmentKey,
      project: row.project,
      projectId: mappedProjectId ? String(mappedProjectId) : "",
      date: row.dateApi ?? "",
      hours: String(row.hours),
      activities: row.activities,
    });
  };

  const handleCancelEdit = () => {
    setEditingRowKey(null);
    setConfirmDeleteRowKey(null);
    setEditingForm({
      departmentId: "",
      project: "",
      projectId: "",
      date: "",
      hours: "",
      activities: "",
    });
  };
  const isUnknownProperty400 = (err: unknown) => {
    const error = err as {
      response?: { status?: number; data?: { message?: string | string[] } };
    };
    if (error.response?.status !== 400) return false;
    const msg = error.response?.data?.message;
    const text = Array.isArray(msg) ? msg.join(" | ") : msg || "";
    return text.includes("should not exist");
  };

  const handleSaveEdit = async (row: TimesheetRow, index: number) => {
    const rowKey = getRowKey(row, index);

    if (!row.entryId) {
      toast.error("Entry ID missing for update");
      return;
    }

    const context = getTeamEditContext();
    if (!context) return;

    const selectedDate = editingForm.date;
    const hours = Number(editingForm.hours);
    const taskDescription = editingForm.activities.trim();
    const selectedDepartmentId = Number(
      editingForm.departmentId || row.departmentId
    );
    const selectedProjectId = Number(editingForm.projectId || row.projectId);
    if (
      !Number.isFinite(hours) ||
      hours < VALIDATION.MIN_HOURS_PER_ENTRY ||
      hours > VALIDATION.MAX_HOURS_PER_ENTRY
    ) {
      toast.error("Invalid hours", {
        description: `Hours must be between ${VALIDATION.MIN_HOURS_PER_ENTRY} and ${VALIDATION.MAX_HOURS_PER_ENTRY}`,
      });
      return;
    }
    if (taskDescription.length < VALIDATION.MIN_TASK_DESCRIPTION_LENGTH) {
      toast.error("Invalid activity", {
        description: `Activity should be at least ${VALIDATION.MIN_TASK_DESCRIPTION_LENGTH} characters`,
      });
      return;
    }

    if (!Number.isFinite(selectedDepartmentId) || selectedDepartmentId <= 0) {
      toast.error("Please select a valid department");
      return;
    }

    if (!Number.isFinite(selectedProjectId) || selectedProjectId <= 0) {
      toast.error("Please select a valid project");
      return;
    }

    if (!selectedDate) {
      toast.error("Please select a valid date");
      return;
    }

    const path = buildTimesheetEntryPath(
      API_PATHS.TIMESHEET_ENTRY_PATCH,
      context.actorId,
      context.targetUserId,
      row.entryId
    );

    const payloadWithDepartment = {
      projectId: selectedProjectId,
      departmentId: selectedDepartmentId,
      date: selectedDate,
      hours,
      activities: taskDescription,
    };
    const payloadWithoutDepartment = {
      projectId: selectedProjectId,
      date: selectedDate,
      hours,
      activities: taskDescription,
    };

    setSavingRowKey(rowKey);
    try {
      try {
        await apiClient.patch(path, payloadWithDepartment);
      } catch (err: unknown) {
        if (!isUnknownProperty400(err)) {
          throw err;
        }
        await apiClient.patch(path, payloadWithoutDepartment);
      }
      toast.success("Entry updated successfully");
      setEditingRowKey(null);
      setRefreshTick((prev) => prev + 1);
    } catch (err: unknown) {
      console.error("Error updating timesheet entry:", err);
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update timesheet entry";
      toast.error("Update failed", {
        description: errorMessage,
      });
    } finally {
      setSavingRowKey(null);
    }
  };

  const handleDeleteEntry = async (row: TimesheetRow, index: number) => {
    const rowKey = getRowKey(row, index);

    if (!row.entryId) {
      toast.error("Entry ID missing for delete");
      return;
    }

    const context = getTeamEditContext();
    if (!context) return;

    const path = buildTimesheetEntryPath(
      API_PATHS.TIMESHEET_ENTRY_DELETE,
      context.actorId,
      context.targetUserId,
      row.entryId
    );

    setDeletingRowKey(rowKey);
    try {
      await apiClient.delete(path);
      toast.success("Entry deleted successfully");
      if (editingRowKey === rowKey) {
        handleCancelEdit();
      }
      setRefreshTick((prev) => prev + 1);
    } catch (err: unknown) {
      console.error("Error deleting timesheet entry:", err);
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete timesheet entry";
      toast.error("Delete failed", {
        description: errorMessage,
      });
    } finally {
      setDeletingRowKey(null);
    }
  };

  const handleOpenTeamLogger = () => {
    if (!canManageTeamEntries) return;
    if (!isTeamMode) {
      toast.error("Open Team Dashboard first");
      return;
    }
    if (!teamUser) {
      toast.error("Select a team member first");
      return;
    }
    resetTeamLoggerForm();
    setIsTeamLoggerOpen(true);
  };

  const handleSubmitTeamLogger = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const targetUserId = getTeamTargetUserId();
    if (!targetUserId) {
      toast.error("Unable to identify team member");
      return;
    }

    const selectedDepartmentId = Number(teamLoggerForm.departmentId);
    const selectedProjectId = Number(teamLoggerForm.projectId);
    const hours = Number(teamLoggerForm.hours);
    const taskDescription = teamLoggerForm.activities.trim();
    const workDate = teamLoggerForm.workDate;

    if (!workDate) {
      toast.error("Please select a date");
      return;
    }

    if (!Number.isFinite(selectedDepartmentId) || selectedDepartmentId <= 0) {
      toast.error("Please select a valid department");
      return;
    }

    if (!Number.isFinite(selectedProjectId) || selectedProjectId <= 0) {
      toast.error("Please select a valid project");
      return;
    }

    if (
      !Number.isFinite(hours) ||
      hours < VALIDATION.MIN_HOURS_PER_ENTRY ||
      hours > VALIDATION.MAX_HOURS_PER_ENTRY
    ) {
      toast.error("Invalid hours", {
        description: `Hours must be between ${VALIDATION.MIN_HOURS_PER_ENTRY} and ${VALIDATION.MAX_HOURS_PER_ENTRY}`,
      });
      return;
    }

    if (taskDescription.length < VALIDATION.MIN_TASK_DESCRIPTION_LENGTH) {
      toast.error("Invalid activity", {
        description: `Activity should be at least ${VALIDATION.MIN_TASK_DESCRIPTION_LENGTH} characters`,
      });
      return;
    }

    const basePayload = {
      workDate,
      notes: "",
      entries: [
        {
          projectId: selectedProjectId,
          taskDescription,
          hours,
        },
      ],
    };

    const payloadsToTry: Array<Record<string, unknown>> = [
      { ...basePayload, userId: targetUserId },
      { ...basePayload, targetUserId },
      { ...basePayload, employeeId: targetUserId },
    ];

    setIsSubmittingTeamLogger(true);
    try {
      await postAdminCreateWithFallbackPayloads(payloadsToTry);
      toast.success("Activity log added successfully");
      setIsTeamLoggerOpen(false);
      setRefreshTick((prev) => prev + 1);
      resetTeamLoggerForm();
    } catch (err: unknown) {
      console.error("Failed to create team activity log:", err);
      const error = err as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };
      const messageFromResponse = error.response?.data?.message;
      const parsedMessage = Array.isArray(messageFromResponse)
        ? messageFromResponse.join(" | ")
        : messageFromResponse;
      toast.error("Failed to add activity log", {
        description:
          parsedMessage || error.message || "Please try again with valid details.",
      });
    } finally {
      setIsSubmittingTeamLogger(false);
    }
  };

  return (
    <>
      <AppHeader
        crumbs={[]}
        className="h-auto min-h-11 py-2"
        left={
          <Tabs
            value={
              isTeamMode
                ? teamVisibilityScope === "all_org"
                  ? "all_org"
                  : "my_reportees"
                : "my"
            }
            onValueChange={(val) => {
              if (val === "my") {
                setTeamVisibilityScope("my_reportees");
                setIsTeamMode(false);
                setTeamUser(null);
                setTeamSearch("");
                setTeamSearchError(null);
                if (typeof window !== "undefined") {
                  const state = window.history.state || {};
                  const { __teamDashboard, ...rest } = state;
                  window.history.replaceState(rest, "");
                }
                return;
              }

              if (val === "all_org" && !canAccessAllOrgDashboard) {
                return;
              }

              setIsTeamMode(true);
              setTeamVisibilityScope(
                val === "all_org" ? "all_org" : "my_reportees"
              );
              setTeamSearch("");
              setTeamSearchError(null);
              setTeamUser(null);
            }}
          >
            <TabsList className="gap-2">
              <TabsTrigger value="my">My Dashboard</TabsTrigger>
              {canAccessTeamDashboard && (
                <TabsTrigger value="my_reportees">My Reportees</TabsTrigger>
              )}
              {canAccessAllOrgDashboard && (
                <TabsTrigger value="all_org">All Org</TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        }
      />
      <PageWrapper>
        <div className="p-4 md:p-6 space-y-5">
          {/* Billing cycle chip */}
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary-background border border-border px-3 py-1.5 rounded-full">
              <Clock className="h-3 w-3 flex-shrink-0" />
              Salary cycle runs from 26th of one month to 25th of the next
            </span>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: "Hours Logged",
                display: String(monthlyData?.totals.timesheetHours || 0),
                unit: "hrs",
                tooltip:
                  "Total hours logged in the current salary cycle. Part-time and hourly employees are paid based on these hours.",
                accent: "border-l-[#74808e]",
              },
              {
                label: "Leave Days",
                display: String(leaveDaysDisplay),
                unit: "days",
                tooltip: "Total approved leave days in the current salary cycle.",
                accent: "border-l-amber-400",
              },
              {
                label: "Lifelines",
                display: (() => {
                  const todayIST = getISTBusinessDate();
                  const period = monthlyData?.period;
                  let isCurrentCycle = false;
                  if (period) {
                    const start = new Date(period.start);
                    const end = new Date(period.end);
                    isCurrentCycle = todayIST >= start && todayIST <= end;
                  }
                  const remaining = isCurrentCycle ? (resolvedBackfill?.remaining ?? 0) : 0;
                  return String(remaining);
                })(),
                unit: "",
                sub: "",
                tooltip:
                  "You're expected to submit timesheets daily. Lifelines allow you to add missed entries for up to 3 past working days. You can use up to 3 lifelines per cycle. This card shows how many lifelines you have remaining in the current cycle.",
                accent: (resolvedBackfill?.remaining ?? 0) > 0 ? "border-l-emerald-400" : "border-l-amber-400",
              },
              {
                label: "Payable Days",
                display: `${payableDays}/${totalCycleDays}`,
                unit: "",
                tooltip:
                  "Applicable only to full-time employees, consultants, and interns. This is your total payable days for the current cycle, including attendance on working days, approved leaves, week-offs (2nd and 4th Saturdays, Sundays), and fixed holidays. Any shortfall is treated as unpaid leave and deducted from your salary.",
                accent: "border-l-[#8a6f5e]",
              },
            ].map((card) => {
              const isLifelineCard = card.label === "Lifelines";
              const canShowLifelineEditor =
                isLifelineCard && isTeamMode && Boolean(teamUser) && canEditTeamLifeline;
              return (
                <div
                  key={card.label}
                  className={cn(
                    "bg-background border border-border border-l-4 rounded-lg p-4 transition-shadow hover:shadow-sm",
                    card.accent
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight">
                      {card.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
                              aria-label={`${card.label} information`}
                            >
                              <CircleHelp className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            className="w-72 max-w-[calc(100vw-2rem)] whitespace-normal break-words text-xs leading-relaxed text-left"
                            side="top"
                            align="end"
                          >
                            {card.tooltip}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  {isLifelineCard && canShowLifelineEditor ? (
                    isEditingLifeline ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <p className="text-2xl font-bold text-foreground tabular-nums leading-none mr-2">{card.display}</p>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={lifelineDraft}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            setLifelineDraft(val);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveLifeline();
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              handleCancelLifelineEdit();
                            }
                          }}
                          disabled={isSavingLifeline}
                          className="h-7 w-20"
                        />
                        <button
                          type="button"
                          onClick={handleSaveLifeline}
                          disabled={isSavingLifeline}
                          className="h-6 w-6 rounded-md border border-border bg-background flex items-center justify-center hover:bg-secondary-background disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Save lifeline balance"
                        >
                          {isSavingLifeline ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground" />
                          ) : (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelLifelineEdit}
                          disabled={isSavingLifeline}
                          className="h-6 w-6 rounded-md border border-border bg-background flex items-center justify-center hover:bg-secondary-background disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Cancel lifeline balance edit"
                        >
                          <X className="h-3.5 w-3.5 text-red-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <p className="text-2xl font-bold text-foreground tabular-nums leading-none mr-2">{card.display}</p>
                        <button
                          type="button"
                          onClick={handleStartLifelineEdit}
                          className="h-5 w-5 rounded-md border border-border bg-background flex items-center justify-center hover:bg-secondary-background"
                          title="Edit lifeline balance"
                        >
                          <Pencil className="h-3 w-3 text-foreground" />
                        </button>
                      </div>
                    )
                  ) : (
                    isLoading ? (
                      <div className="h-8 w-16 bg-secondary-background rounded animate-pulse" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
                        {card.display}
                        {card.unit && (
                          <span className="text-sm font-normal text-muted-foreground ml-1">{card.unit}</span>
                        )}
                      </p>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* Timesheet */}
          <div className="rounded-lg border border-border bg-background overflow-hidden">
            {/* Timesheet header */}
            <div className="px-5 py-4 border-b border-border bg-secondary-background">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Timesheet</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 break-all">
                    {isTeamMode
                      ? teamUser
                        ? teamUser.email || teamUser.user?.email || teamUser.name || teamUser.user?.name || monthlyData?.user?.name
                        : "Select team member"
                      : user?.email || "user@example.com"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Team search (visible after clicking Team Dashboard) */}
                  {canAccessTeamDashboard && isTeamMode && (
                    <div className="mr-2 space-y-1">
                      <div className="flex items-center gap-2">
                        {canManageTeamEntries && (
                          <Button
                            variant="outline"
                            size="default"
                            onClick={handleOpenTeamLogger}
                            disabled={teamSearchLoading || !teamUser}
                            className="h-10 rounded-md border-input bg-background px-4 text-sm font-normal whitespace-nowrap"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Activity Log
                          </Button>
                        )}
                        <SearchCombobox
                          value={teamSearch}
                          onValueChange={(nextValue) => {
                            setTeamSearch(nextValue);
                            if (teamSearchError) setTeamSearchError(null);
                          }}
                          onSelect={(option) => {
                            void searchTeamMemberByEmail(option.value);
                          }}
                          onSubmitValue={(nextValue) => {
                            void searchTeamMemberByEmail(nextValue);
                          }}
                          fetchOptions={fetchTeamMemberOptions}
                          placeholder="Select employee"
                          searchPlaceholder="Search employee..."
                          emptyMessage="No team member found."
                          minQueryLength={0}
                          className="w-[260px]"
                          disabled={teamSearchLoading}
                        />
                      </div>
                      {teamSearchError && (
                        <p className="mt-1 text-xs text-red-600">{teamSearchError}</p>
                      )}
                    </div>
                  )}
                  {/* View toggle */}
                  {!isTeamMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCycleToPdf}
                      disabled={isLoading || !monthlyData || isPdfExporting}
                      className="h-8"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      {isPdfExporting ? "Exporting..." : "Export to PDF"}
                    </Button>
                  )}
                  <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5">
                    <button
                      onClick={() => {
                        setViewMode("table");
                        if (user?.id) {
                          localStorage.setItem(`timesheet-view-mode-${user.id}`, "table");
                        } else {
                          localStorage.setItem("timesheet-view-mode", "table");
                        }
                      }}
                      title="List View"
                      className={cn(
                        "h-7 rounded-md px-3 flex items-center gap-2 transition-all cursor-pointer",
                        viewMode === "table"
                          ? "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <List className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">List View</span>
                    </button>
                    <button
                      onClick={() => {
                        setViewMode("grid");
                        if (user?.id) {
                          localStorage.setItem(`timesheet-view-mode-${user.id}`, "grid");
                        } else {
                          localStorage.setItem("timesheet-view-mode", "grid");
                        }
                      }}
                      title="Calendar View"
                      className={cn(
                        "h-7 rounded-md px-3 flex items-center gap-2 transition-all cursor-pointer",
                        viewMode === "grid"
                          ? "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Calendar View</span>
                    </button>
                  </div>
                  {/* Period navigation */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePreviousMonth}
                      disabled={isLoading}
                      className="h-7 w-7 rounded-md border border-border bg-background flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary-background transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4 text-foreground" />
                    </button>
                    <div className="px-3 py-1 rounded-md border border-border bg-background text-xs text-foreground whitespace-nowrap tabular-nums min-w-[160px] text-center">
                      {monthlyData?.period ? (
                        <>
                          {format(parseISO(monthlyData.period.start), "dd/MM/yyyy")}
                          {" — "}
                          {format(parseISO(monthlyData.period.end), "dd/MM/yyyy")}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                    <button
                      onClick={handleNextMonth}
                      disabled={isLoading}
                      className="h-7 w-7 rounded-md border border-border bg-background flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary-background transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4 text-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Timesheet content */}
            <div className="p-4 sm:p-5">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-foreground" />
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (isTeamMode) {
                        setEmployeeCurrentMonth(new Date(employeeCurrentMonth));
                      } else {
                        setCurrentMonth(new Date(currentMonth));
                      }
                    }}
                  >
                    Retry
                  </Button>
                </div>
              ) : timesheetRows.length === 0 && viewMode === "table" ? (
                <div className="text-center py-16">
                  <p className="text-sm text-muted-foreground">No records found for this period</p>
                </div>
              ) : viewMode === "grid" ? (
                /* Calendar Week View — organized by weeks with day cards */
                (() => {
                  const sortedGridDays = [...(monthlyData?.days ?? [])].sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  );

                  const todayMidnight = new Date();
                  todayMidnight.setHours(0, 0, 0, 0);

                  const cycleStart = parseISO(
                    monthlyData?.period?.start ?? sortedGridDays[0]?.date ?? ""
                  );
                  const firstWeekEnd = endOfMonth(cycleStart);
                  const postFirstWeekStart = addDays(firstWeekEnd, 1);

                  const weekBuckets = new Map<number, typeof sortedGridDays>();
                  sortedGridDays.forEach((day) => {
                    const parsedDate = parseISO(day.date);
                    const isInFirstWeek = parsedDate.getTime() <= firstWeekEnd.getTime();
                    const weekIndex = isInFirstWeek
                      ? 0
                      : 1 +
                        Math.floor(
                          differenceInCalendarDays(parsedDate, postFirstWeekStart) / 6
                        );

                    const bucket = weekBuckets.get(weekIndex) ?? [];
                    bucket.push(day);
                    weekBuckets.set(weekIndex, bucket);
                  });
                  const weeks = Array.from(weekBuckets.entries())
                    .sort(([a], [b]) => a - b)
                    .map(([, weekDays]) => weekDays);

                  // Helper to get day card data
                  const getDayCardData = (
                    day: (typeof sortedGridDays)[0]
                  ) => {
                    const parsedDate = parseISO(day.date);
                    const dayOfWeek = format(parsedDate, "EEEE");
                    const dayShort = format(parsedDate, "EEE");
                    const displayDate = format(parsedDate, "dd");
                    const dayOfMonth = parsedDate.getDate();
                    const weekOfMonth = Math.ceil(dayOfMonth / 7);
                    const isSaturday = dayOfWeek === "Saturday";
                    const is2ndOr4thSaturday =
                      isSaturday && (weekOfMonth === 2 || weekOfMonth === 4);
                    const isSunday = dayOfWeek === "Sunday";
                    const isWeekendOff = is2ndOr4thSaturday || isSunday;

                    const hasTimesheet =
                      (day.timesheet?.entries?.length ?? 0) > 0;
                    const hasLeave =
                      (day.leaves?.entries ?? []).some(
                        (entry: any) => entry.state !== "rejected"
                      );
                    const isOff = isWeekendOff || day.isHoliday;
                    const isUnfilled = !hasTimesheet && !hasLeave && !isOff;

                    const isToday =
                      parsedDate.getFullYear() ===
                      todayMidnight.getFullYear() &&
                      parsedDate.getMonth() === todayMidnight.getMonth() &&
                      parsedDate.getDate() === todayMidnight.getDate();

                    const timesheetEntries = day.timesheet?.entries ?? [];
                    const leaveEntries = day.leaves?.entries ?? [];
                    const totalHours =
                      timesheetEntries.reduce((s, e) => s + e.hours, 0);
                    const dayCreatedAt =
                      timesheetEntries.reduce<string | undefined>(
                      (latest, entry) => {
                        if (!entry.createdAt) return latest;
                        if (!latest) return entry.createdAt;

                        const latestDate = parseISO(latest);
                        const entryDate = parseISO(entry.createdAt);
                        if (
                          isValid(entryDate) &&
                          (!isValid(latestDate) || entryDate.getTime() > latestDate.getTime())
                        ) {
                          return entry.createdAt;
                        }

                        return latest;
                      },
                      undefined
                    ) ?? day.timesheet?.createdAt;

                    let status:
                      | "off"
                      | "unfilled"
                      | "filled"
                      | "rejected"
                      | "pending" = "filled";
                    if (isOff) status = "off";
                    else if (isUnfilled) status = "unfilled";
                    else if (day.timesheet?.state === "rejected")
                      status = "rejected";
                    else if (
                      leaveEntries.some((e: any) => e.state === "rejected")
                    )
                      status = "rejected";
                    else if (
                      leaveEntries.some((e: any) => e.state === "pending")
                    )
                      status = "pending";

                    return {
                      day,
                      parsedDate,
                      dayOfWeek,
                      dayShort,
                      displayDate,
                      isOff,
                      isUnfilled,
                      isToday,
                      totalHours,
                      status,
                      timesheetEntries,
                      dayCreatedAt,
                      leaveEntries,
                      isHoliday: day.isHoliday,
                      holidayName: day.holidayName,
                      is2ndOr4thSaturday,
                      isSunday,
                    };
                  };

                  return (
                    <div className="space-y-4">
                      {weeks.map((weekDays, weekIndex) => {
                        const weekData = weekDays.map(getDayCardData);
                        const weekTotalHours = weekData.reduce(
                          (sum, d) => sum + d.totalHours,
                          0
                        );
                        const unfilledCount = weekData.filter(
                          (d) => d.isUnfilled
                        ).length;

                        return (
                          <div
                            key={weekIndex}
                            className="rounded-[4px] border border-border overflow-hidden"
                            style={{ backgroundColor: "var(--background)" }}
                          >
                            {/* Week Header */}
                            <div
                              className="px-3 py-2 border-b border-border flex items-center justify-between"
                              style={{
                                backgroundColor:
                                  "var(--secondary-background)",
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-xs font-semibold uppercase tracking-wide"
                                  style={{ color: "var(--foreground)" }}
                                >
                                  Week {weekIndex + 1}
                                </span>
                                <span
                                  className="text-xs"
                                  style={{ color: "var(--muted)" }}
                                >
                                  {format(weekData[0].parsedDate, "MMM dd")} —{" "}
                                  {format(
                                    weekData[weekData.length - 1].parsedDate,
                                    "MMM dd"
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                {weekTotalHours > 0 && (
                                  <span style={{ color: "var(--muted)" }}>
                                    {weekTotalHours}h
                                  </span>
                                )}
                                {unfilledCount > 0 && (
                                  <span
                                    className="font-medium"
                                    style={{
                                      color: "var(--color-orange-text)",
                                    }}
                                  >
                                    {unfilledCount} pending
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Week Days Grid */}
                            <div className="px-2 py-2">
                              <div className="grid grid-cols-6 gap-2">
                              {weekData.map((dayData) => {
                                // Determine cell background
                                let cellBg = "var(--background)";
                                if (dayData.isHoliday)
                                  cellBg = "#ddeee6";
                                else if (dayData.isSunday || dayData.is2ndOr4thSaturday)
                                  cellBg = "var(--secondary-background)";
                                else if (dayData.isUnfilled)
                                  cellBg = "#ede4c8";
                                else if (dayData.status === "rejected")
                                  cellBg = "#eddcdc";
                                else if (dayData.status === "pending")
                                  cellBg = "#ece6cc";

                                // Left-border accent via inset shadow (doesn't break divide-x)
                                let accentShadow = "";
                                if (dayData.isHoliday)
                                  accentShadow = "inset 3px 0 0 #5a8a6a";
                                else if (dayData.isUnfilled)
                                  accentShadow = "inset 3px 0 0 #b89848";
                                else if (dayData.status === "rejected")
                                  accentShadow = "inset 3px 0 0 #a05858";
                                else if (dayData.status === "pending")
                                  accentShadow = "inset 3px 0 0 #8a7838";

                                const boxShadow = accentShadow || undefined;

                                return (
                                  <div
                                    key={dayData.day.date}
                                    className={`min-h-[110px] p-2.5 relative cursor-pointer hover:brightness-[0.97] transition-all rounded-[4px]${dayData.isToday ? " today-cell" : ""}`}
                                    style={{
                                      backgroundColor: cellBg,
                                      borderColor: "var(--border)",
                                      borderWidth: "1px",
                                      borderStyle: "solid",
                                      boxShadow,
                                    }}
                                    onClick={() => {
                                      setSelectedDay(dayData.day);
                                      setIsDaySheetOpen(true);
                                    }}
                                  >
                                    {/* Day Header */}
                                    <div className="flex items-start justify-between mb-1.5">
                                      <div className="flex flex-col">
                                        <span
                                          className="text-lg font-semibold leading-none"
                                          style={{
                                            color: "var(--foreground)",
                                          }}
                                        >
                                          {dayData.displayDate}
                                        </span>
                                        <span
                                          className="text-xs uppercase mt-0.5"
                                          style={{ color: "var(--muted)" }}
                                        >
                                          {dayData.dayShort}
                                        </span>
                                      </div>
                                      {dayData.dayCreatedAt && (
                                        <div className="flex items-center gap-1">
                                          {dayData.dayCreatedAt && (
                                            <TooltipProvider>
                                              <Tooltip
                                                open={activeCalendarCreatedAtKey === `day-${dayData.day.date}`}
                                                onOpenChange={(isOpen) => {
                                                  if (isOpen) {
                                                    setActiveCalendarCreatedAtKey(`day-${dayData.day.date}`);
                                                    return;
                                                  }

                                                  setActiveCalendarCreatedAtKey((prev) =>
                                                    prev === `day-${dayData.day.date}` ? null : prev
                                                  );
                                                }}
                                              >
                                                <TooltipTrigger asChild>
                                                  <button
                                                    type="button"
                                                    className="inline-flex h-4 w-4 items-center justify-center text-amber-600 hover:text-amber-700"
                                                    aria-label="Show created at timestamp"
                                                    onClick={(event) => {
                                                      event.stopPropagation();
                                                      setActiveCalendarCreatedAtKey((prev) =>
                                                        prev === `day-${dayData.day.date}`
                                                          ? null
                                                          : `day-${dayData.day.date}`
                                                      );
                                                    }}
                                                  >
                                                    <AlertTriangle className="h-3 w-3" />
                                                  </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                  <div className="text-xs whitespace-nowrap">
                                                    Created: {format(parseISO(dayData.dayCreatedAt), "dd/MM/yyyy HH:mm")}
                                                  </div>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                          <span
                                            className="text-xs font-semibold px-1.5 py-0.5 rounded-[3px]"
                                            style={{
                                              backgroundColor:
                                                dayData.status === "rejected"
                                                  ? "#ecdcdc"
                                                  : dayData.status === "pending"
                                                    ? "#ece6cc"
                                                    : dayData.status === "filled"
                                                      ? "#daeae2"
                                                      : "var(--secondary-background)",
                                              color:
                                                dayData.status === "rejected"
                                                  ? "#803838"
                                                  : dayData.status === "pending"
                                                    ? "#786020"
                                                    : dayData.status === "filled"
                                                      ? "#386050"
                                                      : "var(--foreground)",
                                            }}
                                          >
                                            {dayData.totalHours}h
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Day Content */}
                                    <div className="space-y-0.5">
                                      {/* Off day indicator */}
                                      {dayData.isOff && (
                                        <div
                                          className="text-xs font-medium"
                                          style={{
                                            color: dayData.isHoliday
                                              ? "#3a6a4a"
                                              : "var(--muted)",
                                          }}
                                        >
                                          {dayData.isHoliday
                                            ? "Holiday"
                                            : dayData.isSunday
                                              ? "Sunday"
                                              : "Off"}
                                        </div>
                                      )}

                                      {/* Holiday name */}
                                      {dayData.isHoliday &&
                                        dayData.holidayName && (
                                          <div
                                            className="text-xs truncate"
                                            style={{ color: "#3a6a4a" }}
                                          >
                                            {dayData.holidayName}
                                          </div>
                                        )}

                                      {/* Timesheet entries */}
                                      {dayData.timesheetEntries.length >
                                        0 && (
                                          <div className="space-y-1">
                                            {dayData.timesheetEntries.map(
                                              (entry, i) => (
                                                <div
                                                  key={i}
                                                  className="text-xs truncate flex items-center gap-1"
                                                >
                                                    <span
                                                      className="font-medium truncate"
                                                      style={{
                                                        color:
                                                          "var(--foreground)",
                                                      }}
                                                    >
                                                      {entry.projectName ||
                                                        "Project"}
                                                    </span>
                                                    <span
                                                      className="font-medium flex-shrink-0"
                                                      style={{
                                                        color: "var(--muted)",
                                                      }}
                                                    >
                                                      {entry.hours}h
                                                    </span>
                                                    {dayData.day.timesheet
                                                      ?.state === "rejected" && (
                                                        <span
                                                          className="flex-shrink-0"
                                                          style={{
                                                            color: "#903030",
                                                          }}
                                                        >
                                                          ×
                                                        </span>
                                                      )}
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}

                                      {/* Leave entries */}
                                      {dayData.leaveEntries.length > 0 && (
                                        <div className="space-y-1">
                                          {dayData.leaveEntries.map(
                                            (entry: any, i) => (
                                              <div
                                                key={i}
                                                className="text-xs truncate flex items-center gap-1"
                                              >
                                                <span
                                                  className="font-medium truncate"
                                                  style={{
                                                    color:
                                                      "var(--foreground)",
                                                  }}
                                                >
                                                  {entry.leaveType.name}
                                                </span>
                                                <span
                                                  className="font-medium flex-shrink-0"
                                                  style={{
                                                    color: "var(--muted)",
                                                  }}
                                                >
                                                  {entry.hours}h
                                                </span>
                                                {entry.state ===
                                                  "pending" && (
                                                    <span
                                                      className="flex-shrink-0"
                                                      style={{
                                                        color: "#806020",
                                                      }}
                                                    >
                                                      ○
                                                    </span>
                                                  )}
                                                {entry.state ===
                                                  "rejected" && (
                                                    <span
                                                      className="flex-shrink-0"
                                                      style={{
                                                        color: "#903030",
                                                      }}
                                                    >
                                                      ×
                                                    </span>
                                                  )}
                                              </div>
                                            )
                                          )}
                                        </div>
                                      )}

                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap w-28 text-center">
                            Date
                          </TableHead>
                          <TableHead className="whitespace-nowrap w-28">
                            Day
                          </TableHead>
                          <TableHead className="whitespace-nowrap w-20 text-center">
                            Total Hours
                          </TableHead>
                          <TableHead className="whitespace-nowrap w-32">
                            Project
                          </TableHead>
                          <TableHead className="whitespace-nowrap w-20 text-center">
                            Hours
                          </TableHead>
                          <TableHead>Activities</TableHead>
                          <TableHead className="whitespace-nowrap w-40">
                            Created At
                          </TableHead>
                          {isTeamMode && canManageTeamEntries && (
                            <TableHead className="whitespace-nowrap w-32 text-center">
                              Actions
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timesheetRows.map((row, index) => {
                          // Check if this row has the same date as the previous/next row
                          const prevRow =
                            index > 0 ? timesheetRows[index - 1] : null;
                          const nextRow =
                            index < timesheetRows.length - 1
                              ? timesheetRows[index + 1]
                              : null;
                          const isSameDateAsPrev =
                            prevRow && prevRow.date === row.date;
                          const isSameDateAsNext =
                            nextRow && nextRow.date === row.date;

                          let bgColor: string | undefined;
                          let isColored = false;

                          if (
                            (row.isLeave && row.leaveStatus === "rejected") ||
                            row.timesheetState === "rejected"
                          ) {
                            bgColor = "#f6d8dd";
                            isColored = true;
                          } else if (
                            row.isLeave &&
                            row.leaveStatus === "pending"
                          ) {
                            bgColor = "#f8efcc";
                            isColored = true;
                          } else if (
                            row.isLeave && row.leaveStatus === "approved"
                          ) {
                            bgColor = "#d9eee2";
                            isColored = true;
                          } else if (row.isHoliday) {
                            bgColor = "#d9eee2";
                            isColored = true;
                          } else if (row.isWeekend) {
                            bgColor = "var(--secondary-background)";
                            isColored = true;
                          } else {
                            bgColor = "var(--background)";
                          }

                          const rowKey = getRowKey(row, index);
                          const canManageEntry =
                            isTeamMode &&
                            canManageTeamEntries &&
                            !row.isLeave &&
                            Boolean(row.entryId);
                          const isEditing =
                            canManageTeamEntries && editingRowKey === rowKey;
                          const isSaving = savingRowKey === rowKey;
                          const isDeleting = deletingRowKey === rowKey;
                          const isConfirmingDelete = confirmDeleteRowKey === rowKey;
                          const isRejectedLeaveRow =
                            row.isLeave && row.leaveStatus === "rejected";
                          const isEmptyWorkingDayRow =
                            (!row.isLeave &&
                              !row.isHoliday &&
                              !row.isWeekend &&
                              row.project === "-" &&
                              row.activities === "-") ||
                            (isRejectedLeaveRow && !row.isHoliday && !row.isWeekend);
                          const isTargetDateRow =
                            highlightedDateApi !== null &&
                            row.dateApi === highlightedDateApi;
                          const projectPill = getProjectPill(row);

                          return (
                            <TableRow
                              key={`${row.date}-${index}`}
                              data-date-api={row.dateApi ?? undefined}
                              style={{
                                backgroundColor: bgColor,
                                borderBottom: isSameDateAsNext
                                  ? "none"
                                  : undefined,
                                borderTop: !isSameDateAsPrev && index > 0
                                  ? "2px solid var(--border)"
                                  : undefined,
                                boxShadow: isTargetDateRow
                                  ? "inset 5px 0 0 #2f2f2f, 0 0 0 2px rgba(0, 0, 0, 0.22)"
                                  : undefined,
                              }}
                              className={cn(
                                isColored ? "hover:opacity-95" : "",
                                isTargetDateRow && "animate-[pulse_1s_ease-in-out_3]"
                              )}
                            >
                              <TableCell className="px-3 py-2.5 text-sm text-foreground whitespace-nowrap text-center">
                                {isEditing ? (
                                  <Input
                                    type="date"
                                    value={editingForm.date}
                                    onChange={(e) =>
                                      setEditingForm((prev) => ({
                                        ...prev,
                                        date: e.target.value,
                                      }))
                                    }
                                    className="h-8 w-36"
                                  />
                                ) : !isSameDateAsPrev ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>{row.date}</span>
                                    {dateCreatedAtMap.get(row.date) && (
                                      <TooltipProvider>
                                        <Tooltip
                                          open={activeCalendarCreatedAtKey === `row-${row.date}`}
                                          onOpenChange={(isOpen) => {
                                            if (isOpen) {
                                              setActiveCalendarCreatedAtKey(`row-${row.date}`);
                                              return;
                                            }

                                            setActiveCalendarCreatedAtKey((prev) =>
                                              prev === `row-${row.date}` ? null : prev
                                            );
                                          }}
                                        >
                                          <TooltipTrigger asChild>
                                            <button
                                              type="button"
                                              className="inline-flex h-4 w-4 items-center justify-center text-amber-600 hover:text-amber-700"
                                              aria-label="Show created at timestamp"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                setActiveCalendarCreatedAtKey((prev) =>
                                                  prev === `row-${row.date}`
                                                    ? null
                                                    : `row-${row.date}`
                                                );
                                              }}
                                            >
                                              <AlertTriangle className="h-3 w-3" />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top">
                                            <div className="text-xs whitespace-nowrap">
                                              Created: {formatCreatedAt(dateCreatedAtMap.get(row.date))}
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                ) : (
                                  ""
                                )}
                              </TableCell>
                              <TableCell className="px-3 py-2.5 text-sm text-foreground whitespace-nowrap">
                                {!isSameDateAsPrev ? row.day : ""}
                              </TableCell>
                              <TableCell className="px-3 py-2.5 text-sm text-center whitespace-nowrap font-semibold">
                                {!isSameDateAsPrev ? (
                                  <span style={{ color: "var(--foreground)" }}>
                                    {dailyTotals.get(row.date) ?? 0}h
                                  </span>
                                ) : ""}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "px-3 py-2.5 text-sm text-foreground whitespace-nowrap",
                                  isEditing && "align-top min-w-[240px]"
                                )}
                              >
                                {isEditing ? (
                                  <div className="space-y-1.5">
                                    <select
                                      value={editingForm.departmentId}
                                      onChange={(e) => {
                                        const nextDepartmentId = e.target.value;
                                        setEditingForm((prev) => ({
                                          ...prev,
                                          departmentId: nextDepartmentId,
                                          projectId: "",
                                          project: "",
                                        }));
                                        if (nextDepartmentId) {
                                          void fetchTeamLoggerProjectsForDepartment(
                                            nextDepartmentId
                                          );
                                        }
                                      }}
                                      className="block h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                                    >
                                      <option value="">Select department</option>
                                      {editingForm.departmentId &&
                                        !teamDepartments.some(
                                          (department) =>
                                            String(department.id) ===
                                            editingForm.departmentId
                                        ) && (
                                          <option value={editingForm.departmentId}>
                                            {row.department || "Current department"}
                                          </option>
                                        )}
                                      {teamDepartments.map((department) => (
                                        <option
                                          key={department.id}
                                          value={String(department.id)}
                                        >
                                          {department.name}
                                        </option>
                                      ))}
                                    </select>
                                    {(() => {
                                      const selectedDepartmentId =
                                        editingForm.departmentId;
                                      const projectOptions = selectedDepartmentId
                                        ? teamProjectsByDepartment[
                                        selectedDepartmentId
                                        ] || []
                                        : [];

                                      return (
                                        <select
                                          value={editingForm.projectId}
                                          onChange={(e) =>
                                            setEditingForm((prev) => ({
                                              ...prev,
                                              projectId: e.target.value,
                                              project:
                                                projectOptions.find(
                                                  (p) =>
                                                    String(p.id) ===
                                                    e.target.value
                                                )?.name ?? prev.project,
                                            }))
                                          }
                                          className="block h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                                          disabled={
                                            !selectedDepartmentId ||
                                            teamLoggerProjectsLoading
                                          }
                                        >
                                          <option value="">
                                            {!selectedDepartmentId
                                              ? "Select department first"
                                              : teamLoggerProjectsLoading
                                                ? "Loading projects..."
                                                : "Select project"}
                                          </option>
                                          {editingForm.projectId &&
                                            !projectOptions.some(
                                              (project) =>
                                                String(project.id) ===
                                                editingForm.projectId
                                            ) && (
                                              <option value={editingForm.projectId}>
                                                {editingForm.project || row.project}
                                              </option>
                                            )}
                                          {projectOptions.map((project) => (
                                            <option
                                              key={project.id}
                                              value={String(project.id)}
                                            >
                                              {project.name}
                                            </option>
                                          ))}
                                        </select>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  projectPill ? (
                                    <span className={getProjectPillClassName(projectPill.tone)}>
                                      {projectPill.label}
                                    </span>
                                  ) : (
                                    row.project
                                  )
                                )}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "px-3 py-2.5 text-sm text-foreground text-center font-medium whitespace-nowrap",
                                  isEditing && "align-top"
                                )}
                              >
                                {isEditing ? (
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={editingForm.hours}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/[^0-9.]/g, "");
                                      setEditingForm((prev) => ({
                                        ...prev,
                                        hours: val,
                                      }));
                                    }}
                                    className="h-8 w-16 text-center"
                                  />
                                ) : (
                                  row.isLeave
                                    ? (row.hoursDisplay || "-")
                                    : row.hours
                                )}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "px-3 py-2.5 text-sm text-foreground",
                                  isEditing && "align-top"
                                )}
                              >
                                {isEditing ? (
                                  <Input
                                    type="text"
                                    value={editingForm.activities}
                                    onChange={(e) =>
                                      setEditingForm((prev) => ({
                                        ...prev,
                                        activities: e.target.value,
                                      }))
                                    }
                                    className="h-8 min-w-[280px]"
                                  />
                                ) : (
                                  isEmptyWorkingDayRow ? (
                                    renderEmptyDayActions({
                                      dateApi: row.dateApi,
                                      layout: "inline",
                                      stopPropagation: true,
                                      showLabel: false,
                                    })
                                  ) : (
                                    <>
                                      {row.activities}
                                      {!row.isLeave && row.timesheetState === "rejected" && (
                                        <span
                                          className="font-semibold ml-1"
                                          style={{ color: "#903030" }}
                                        >
                                          · Rejected
                                        </span>
                                      )}
                                    </>
                                  )
                                )}
                              </TableCell>
                              <TableCell className="px-3 py-2.5 text-sm text-foreground whitespace-nowrap">
                                {row.createdAt ? (
                                  formatCreatedAt(row.createdAt)
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              {isTeamMode && canManageTeamEntries && (
                                <TableCell className="px-3 py-2.5 text-center">
                                  {canManageEntry ? (
                                    <div className="inline-flex items-center gap-1.5">
                                      {isEditing ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleSaveEdit(row, index)
                                            }
                                            disabled={isSaving || isDeleting}
                                            className="h-7 w-7 rounded-md border border-border bg-background flex items-center justify-center hover:bg-secondary-background disabled:opacity-40 disabled:cursor-not-allowed"
                                            title="Save changes"
                                          >
                                            {isSaving ? (
                                              <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground" />
                                            ) : (
                                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                                            )}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            disabled={isSaving || isDeleting}
                                            className="h-7 w-7 rounded-md border border-border bg-background flex items-center justify-center hover:bg-secondary-background disabled:opacity-40 disabled:cursor-not-allowed"
                                            title="Cancel editing"
                                          >
                                            <X className="h-3.5 w-3.5 text-red-600" />
                                          </button>
                                        </>
                                      ) : isConfirmingDelete ? (
                                        <div className="inline-flex items-center gap-1.5">
                                          <span className="text-xs text-muted-foreground whitespace-nowrap">Are you sure you want to delete this entry?</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setConfirmDeleteRowKey(null);
                                              handleDeleteEntry(row, index);
                                            }}
                                            disabled={isDeleting}
                                            className="h-7 w-7 rounded-md border border-red-300 bg-red-50 flex items-center justify-center hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                            title="Confirm delete"
                                          >
                                            {isDeleting ? (
                                              <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
                                            ) : (
                                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                            )}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConfirmDeleteRowKey(null)}
                                            disabled={isDeleting}
                                            className="h-7 w-7 rounded-md border border-border bg-background flex items-center justify-center hover:bg-secondary-background disabled:opacity-40 disabled:cursor-not-allowed"
                                            title="Cancel delete"
                                          >
                                            <X className="h-3.5 w-3.5 text-foreground" />
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleStartEdit(row, index)
                                            }
                                            disabled={isSaving || isDeleting}
                                            className="h-7 w-7 rounded-md border border-border bg-background flex items-center justify-center hover:bg-secondary-background disabled:opacity-40 disabled:cursor-not-allowed"
                                            title="Edit entry"
                                          >
                                            <Pencil className="h-3.5 w-3.5 text-foreground" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setConfirmDeleteRowKey(rowKey)
                                            }
                                            disabled={isSaving || isDeleting}
                                            className="h-7 w-7 rounded-md border border-border bg-background flex items-center justify-center hover:bg-secondary-background disabled:opacity-40 disabled:cursor-not-allowed"
                                            title="Delete entry"
                                          >
                                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-2 max-h-[60vh] overflow-y-auto">
                    {timesheetRows.map((row, index) => {
                      // Check if this row has the same date as the previous row
                      const prevRow =
                        index > 0 ? timesheetRows[index - 1] : null;
                      const isSameDateAsPrev =
                        prevRow && prevRow.date === row.date;

                      let bgColor = undefined;
                      const projectPill = getProjectPill(row);

                      if (
                        (row.isLeave && row.leaveStatus === "rejected") ||
                        row.timesheetState === "rejected"
                      ) {
                        bgColor = "#f6d8dd";
                      } else if (
                        row.isLeave &&
                        row.leaveStatus === "pending"
                      ) {
                        bgColor = "#f8efcc";
                      } else if (
                        row.isHoliday ||
                        row.isWeekend ||
                        (row.isLeave && row.leaveStatus === "approved")
                      ) {
                        bgColor = "#d9eee2";
                      } else {
                        bgColor = "var(--background)";
                      }

                      const isEmptyWorkingDayRow =
                        (!row.isLeave &&
                          !row.isHoliday &&
                          !row.isWeekend &&
                          row.project === "-" &&
                          row.activities === "-") ||
                        (row.isLeave &&
                          row.leaveStatus === "rejected" &&
                          !row.isHoliday &&
                          !row.isWeekend);

                      return (
                        <div
                          key={`${row.date}-${index}`}
                          data-date-api={row.dateApi ?? undefined}
                          className={cn(
                            "border border-border rounded-[4px] p-4 space-y-2",
                            highlightedDateApi !== null &&
                            row.dateApi === highlightedDateApi &&
                            "animate-[pulse_1s_ease-in-out_3]"
                          )}
                          style={{
                            backgroundColor: bgColor,
                            boxShadow:
                              highlightedDateApi !== null &&
                                row.dateApi === highlightedDateApi
                                ? "inset 5px 0 0 #2f2f2f, 0 0 0 2px rgba(0, 0, 0, 0.22)"
                                : undefined,
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5 flex-1">
                              {!isSameDateAsPrev && (
                                <p className="text-sm font-medium text-foreground flex items-center gap-1.5 flex-wrap">
                                  <span>
                                    {row.date} - {row.day}
                                  </span>
                                  {dateCreatedAtMap.get(row.date) && (
                                    <TooltipProvider>
                                      <Tooltip
                                        open={activeCalendarCreatedAtKey === `mobile-${row.date}`}
                                        onOpenChange={(isOpen) => {
                                          if (isOpen) {
                                            setActiveCalendarCreatedAtKey(`mobile-${row.date}`);
                                            return;
                                          }

                                          setActiveCalendarCreatedAtKey((prev) =>
                                            prev === `mobile-${row.date}` ? null : prev
                                          );
                                        }}
                                      >
                                        <TooltipTrigger asChild>
                                          <button
                                            type="button"
                                            className="inline-flex h-4 w-4 items-center justify-center text-amber-600 hover:text-amber-700"
                                            aria-label="Show created at timestamp"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              setActiveCalendarCreatedAtKey((prev) =>
                                                prev === `mobile-${row.date}`
                                                  ? null
                                                  : `mobile-${row.date}`
                                              );
                                            }}
                                          >
                                            <AlertTriangle className="h-3 w-3" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                          <div className="text-xs whitespace-nowrap">
                                            Created: {formatCreatedAt(dateCreatedAtMap.get(row.date))}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-foreground">
                                {row.isLeave
                                  ? (row.hoursDisplay || "-")
                                  : `${row.hours}h`}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">
                              Project
                            </p>
                            {projectPill ? (
                              <span className={getProjectPillClassName(projectPill.tone)}>
                                {projectPill.label}
                              </span>
                            ) : (
                              <p className="text-sm text-foreground">
                                {row.project}
                              </p>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">
                              Activities
                            </p>
                            {isEmptyWorkingDayRow ? (
                              renderEmptyDayActions({
                                dateApi: row.dateApi,
                                layout: "stack",
                                showLabel: false,
                              })
                            ) : (
                              <p className="text-sm text-foreground">
                                {row.activities}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Team Activity Logger Sheet (admin/super admin) */}
        <Sheet open={isTeamLoggerOpen} onOpenChange={setIsTeamLoggerOpen}>
          <SheetContent side="right" className="w-full sm:w-[520px] p-0">
            <div className="h-full flex flex-col">
              <SheetHeader className="px-6 py-5 border-b border-border">
                <SheetTitle>Team Activity Logger</SheetTitle>
                <SheetDescription>
                  Add activity log for selected team member.
                </SheetDescription>
              </SheetHeader>

              <form onSubmit={handleSubmitTeamLogger} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Team Member</Label>
                  <p className="text-sm font-medium text-foreground break-all">
                    {teamUser?.email ||
                      teamUser?.workEmail ||
                      teamUser?.officialEmail ||
                      teamUser?.user?.email ||
                      teamUser?.searchedEmail ||
                      (teamSearch ? teamSearch.trim() : "") ||
                      "Email not available"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <Label htmlFor="team-activity-date">Work Date</Label>
                    <Input
                      id="team-activity-date"
                      type="date"
                      value={teamLoggerForm.workDate}
                      onChange={(e) =>
                        setTeamLoggerForm((prev) => ({
                          ...prev,
                          workDate: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="team-activity-hours">Hours</Label>
                    <Input
                      id="team-activity-hours"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.0"
                      value={teamLoggerForm.hours}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        setTeamLoggerForm((prev) => ({
                          ...prev,
                          hours: val,
                        }));
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="team-activity-department">
                    Current Working Department
                  </Label>
                  <Select
                    value={teamLoggerForm.departmentId}
                    onValueChange={(nextDepartmentId) => {
                      setTeamLoggerForm((prev) => ({
                        ...prev,
                        departmentId: nextDepartmentId,
                        projectId: "",
                      }));
                      if (nextDepartmentId) {
                        fetchTeamLoggerProjectsForDepartment(nextDepartmentId);
                      }
                    }}
                  >
                    <SelectTrigger id="team-activity-department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamDepartments.map((department) => (
                        <SelectItem
                          key={department.id}
                          value={String(department.id)}
                        >
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="team-activity-project">Project</Label>
                  <Select
                    value={teamLoggerForm.projectId}
                    onValueChange={(value) =>
                      setTeamLoggerForm((prev) => ({
                        ...prev,
                        projectId: value,
                      }))
                    }
                    disabled={
                      !teamLoggerForm.departmentId || teamLoggerProjectsLoading
                    }
                  >
                    <SelectTrigger id="team-activity-project">
                      <SelectValue
                        placeholder={
                          !teamLoggerForm.departmentId
                            ? "Select department first"
                            : teamLoggerProjectsLoading
                              ? "Loading projects..."
                              : "Select project"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(teamProjectsByDepartment[teamLoggerForm.departmentId] || []).map(
                        (project) => (
                          <SelectItem
                            key={project.id}
                            value={String(project.id)}
                          >
                            {project.name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="team-activity-description">Activities</Label>
                  <Textarea
                    id="team-activity-description"
                    placeholder="Describe the work done"
                    value={teamLoggerForm.activities}
                    onChange={(e) =>
                      setTeamLoggerForm((prev) => ({
                        ...prev,
                        activities: e.target.value,
                      }))
                    }
                    minLength={VALIDATION.MIN_TASK_DESCRIPTION_LENGTH}
                    required
                  />
                </div>

                <div className="pt-3 flex items-center gap-2.5">
                  <Button
                    type="submit"
                    disabled={isSubmittingTeamLogger || !teamUser}
                    className="min-w-[150px]"
                  >
                    {isSubmittingTeamLogger ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Activity Log"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsTeamLoggerOpen(false)}
                    disabled={isSubmittingTeamLogger}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </SheetContent>
        </Sheet>

        {/* Day Detail Sheet */}
        <Sheet open={isDaySheetOpen} onOpenChange={setIsDaySheetOpen}>
          <SheetContent side="right" className="w-full md:w-[400px] p-0">
            <SheetTitle className="sr-only">
              {selectedDay
                ? format(parseISO(selectedDay.date), "EEEE, MMM d")
                : "Day Details"}
            </SheetTitle>
            {selectedDay && (
              <div className="h-full flex flex-col">
                {/* Header */}
                <div
                  className="px-5 py-4 border-b border-border"
                  style={{ backgroundColor: "var(--secondary-background)" }}
                >
                  <div className="flex items-center gap-2">
                    <Calendar
                      className="h-4 w-4"
                      style={{ color: "var(--foreground)" }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {format(parseISO(selectedDay.date), "EEEE, MMM d")}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                    {selectedDay.isHoliday
                      ? selectedDay.holidayName
                      : selectedDay.isWeekend
                        ? "Weekend"
                        : selectedDay.isWorkingDay
                          ? "Working Day"
                          : "Non-working Day"}
                  </p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Hours Summary */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p
                        className="text-[10px] uppercase tracking-wide mb-1"
                        style={{ color: "var(--muted)" }}
                      >
                        Timesheet
                      </p>
                      <p
                        className="text-xl font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {selectedDay.timesheet?.totalHours || 0}h
                      </p>
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-[10px] uppercase tracking-wide mb-1"
                        style={{ color: "var(--muted)" }}
                      >
                        Leave
                      </p>
                      <p
                        className="text-xl font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {selectedDay.leaves?.totalHours || 0}h
                      </p>
                    </div>
                  </div>

                  {/* Timesheet Entries */}
                  {selectedDay.timesheet &&
                    selectedDay.timesheet.entries.length > 0 && (
                      <div className="space-y-2">
                        <p
                          className="text-xs font-medium"
                          style={{ color: "var(--foreground)" }}
                        >
                          Timesheet
                        </p>
                        <div className="space-y-2">
                          {selectedDay.timesheet.entries.map((entry, index) => (
                            <div
                              key={index}
                              className="py-2 border-b border-border last:border-0"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p
                                  className="text-sm font-medium truncate"
                                  style={{ color: "var(--foreground)" }}
                                >
                                  {entry.projectName || "—"}
                                </p>
                                <span
                                  className="text-xs shrink-0"
                                  style={{ color: "var(--muted)" }}
                                >
                                  {entry.hours}h
                                </span>
                              </div>
                              <p
                                className="text-xs mt-0.5"
                                style={{ color: "var(--muted)" }}
                              >
                                {entry.departmentName}
                              </p>
                              {entry.taskDescription && (
                                <p
                                  className="text-xs mt-1.5"
                                  style={{ color: "var(--muted)" }}
                                >
                                  {entry.taskDescription}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        {selectedDay.timesheet.notes && (
                          <p
                            className="text-xs pt-2"
                            style={{ color: "var(--color-yellow-text)" }}
                          >
                            Note: {selectedDay.timesheet.notes}
                          </p>
                        )}
                      </div>
                    )}

                  {/* Leave Entries */}
                  {selectedDay.leaves &&
                    selectedDay.leaves.entries.length > 0 && (
                      <div className="space-y-2">
                        <p
                          className="text-xs font-medium"
                          style={{ color: "var(--foreground)" }}
                        >
                          Leave
                        </p>
                        <div className="space-y-2">
                          {selectedDay.leaves.entries.map(
                            (entry: any, index) => {
                              const status = entry.state || "approved";
                              const statusColors: Record<string, string> = {
                                approved: "var(--color-green-text)",
                                pending: "var(--color-yellow-text)",
                              };
                              const color =
                                statusColors[status] || statusColors.approved;

                              return (
                                <div
                                  key={index}
                                  className="py-2 border-b border-border last:border-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <span
                                      className="text-sm"
                                      style={{ color: "var(--foreground)" }}
                                    >
                                      {entry.leaveType.name}
                                    </span>
                                    <span
                                      className="text-xs capitalize"
                                      style={{ color }}
                                    >
                                      {status}
                                    </span>
                                  </div>
                                  <p
                                    className="text-xs mt-0.5"
                                    style={{ color: "var(--muted)" }}
                                  >
                                    {entry.hours} hours
                                  </p>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}

                  {/* Empty State */}
                  {(!selectedDay.timesheet ||
                    selectedDay.timesheet.entries.length === 0) &&
                    (!selectedDay.leaves ||
                      selectedDay.leaves.entries.length === 0) &&
                    !selectedDay.isHoliday &&
                    !selectedDay.isWeekend && (
                      <p
                        className="text-sm text-center py-4"
                        style={{ color: "var(--muted)" }}
                      >
                        No entries
                      </p>
                    )}

                  {/* Off Day */}
                  {(selectedDay.isHoliday || selectedDay.isWeekend) && (
                    <p
                      className="text-sm"
                      style={{ color: "var(--color-green-text)" }}
                    >
                      No timesheet required
                    </p>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </PageWrapper>
    </>
  );
}
