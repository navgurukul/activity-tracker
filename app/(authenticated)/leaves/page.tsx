"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { Search, TreePalm, Clock, CheckCircle2, Calendar as CalendarIcon, X, Pencil, Plus, AlertCircle } from "lucide-react";
import { DateRange } from "react-day-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AppHeader } from "@/app/_components/AppHeader";
import { PageWrapper } from "@/app/_components/wrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  SearchCombobox,
  SearchComboboxOption,
} from "@/components/ui/search-combobox";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "./history/_components/data-table";
import { columns, type LeaveRequest as TeamLeaveRequest } from "./history/_components/columns";
import { LeaveTable } from "./history/_components/LeaveTable";
import { NewLeaveRequestDialog } from "./_components/NewLeaveRequestDialog";
import apiClient from "@/lib/api-client";
import { API_PATHS, DATE_FORMATS, VALIDATION } from "@/lib/constants";
import { mockDataService } from "@/lib/mock-data";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { cn } from "@/lib/utils";
import { ROLES } from "@/lib/rbac-constants";
import {
  checkLeaveConflictWithTimesheet,
  invalidateMonthlyTimesheetCache,
} from "@/lib/leave-timesheet-validator";

interface LeaveRequest {
  id: number;
  user: { id: number; name: string; email: string };
  managerId: number;
  leaveType: { id: number; name: string; code: string };
  state: "pending" | "approved" | "rejected";
  startDate: string;
  endDate: string;
  durationType: "full_day" | "half_day";
  halfDaySegment: "first_half" | "second_half" | null;
  hours: number;
  reason: string;
  requestedAt: string;
  updatedAt: string;
  decidedByUserId: number | null;
}

interface LeaveBalanceItem {
  id: number;
  userId?: number;
  leaveTypeId: number;
  balanceHours: number;
  pendingHours: number;
  bookedHours: number;
  allocatedHours: number;
  asOfDate: string;
  leaveType: {
    id: number;
    code: string;
    name: string;
    paid: boolean;
    requiresApproval: boolean;
  };
}

type LeavesMainTab = "leaves" | "balance" | "team";

interface PersistedLeavesState {
  activeMainTab?: LeavesMainTab;
  isTeamEmployeeBalanceView?: boolean;
  teamEmployeeEmail?: string;
}

export default function LeavesPage() {
  const { user } = useAuth();
  const canEditTeamPendingRequests = useRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  const canUseLeaveSearch = useRole([
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
    ROLES.MANAGER,
  ]);

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
  const [activeMainTab, setActiveMainTab] = useState<LeavesMainTab>("leaves");

  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [teamLeaveHistory, setTeamLeaveHistory] = useState<TeamLeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTeamLoading, setIsTeamLoading] = useState(true);
  const [isBalancesLoading, setIsBalancesLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>();
  const [leavesPage, setLeavesPage] = useState(1);

  const [teamPage, setTeamPage] = useState(1);
  const [teamPageSize, setTeamPageSize] = useState(10);
  const [teamSearch, setTeamSearch] = useState("");
  const [isTeamEmployeeBalanceView, setIsTeamEmployeeBalanceView] = useState(false);
  const [showTeamEmployeeBalanceSearch, setShowTeamEmployeeBalanceSearch] = useState(false);
  const [teamEmployeeBalanceEmail, setTeamEmployeeBalanceEmail] = useState("");
  const [selectedTeamEmployeeEmail, setSelectedTeamEmployeeEmail] = useState("");
  const [selectedTeamEmployeeUserId, setSelectedTeamEmployeeUserId] = useState<number | null>(null);
  const [teamEmployeeBalances, setTeamEmployeeBalances] = useState<LeaveBalanceItem[]>([]);
  const [isTeamEmployeeBalanceLoading, setIsTeamEmployeeBalanceLoading] =
    useState(false);

  // Edit allocated balance state
  const [editingAllocatedBalance, setEditingAllocatedBalance] = useState<LeaveBalanceItem | null>(null);
  const [editingAllocatedHours, setEditingAllocatedHours] = useState<string>("");
  const [isUpdatingAllocated, setIsUpdatingAllocated] = useState(false);

  // Admin apply leave state
  const [adminApplyLeaveOpen, setAdminApplyLeaveOpen] = useState(false);
  const [adminApplLeaveSubmitting, setAdminApplyLeaveSubmitting] = useState(false);
  const [adminLeaveTypes, setAdminLeaveTypes] = useState<any[]>([]);
  const [adminLeaveDateRange, setAdminLeaveDateRange] = useState<DateRange | undefined>();
  const [isAdminDatePickerOpen, setIsAdminDatePickerOpen] = useState(false);
  const [adminLeaveValidationError, setAdminLeaveValidationError] = useState<string | null>(null);
  const [adminLeaveIsValidating, setAdminLeaveIsValidating] = useState(false);

  const adminApplyLeaveFormSchema = z
    .object({
      leaveType: z.string().min(1, "Please select a leave type."),
      reason: z
        .string()
        .min(
          VALIDATION.MIN_LEAVE_REASON_LENGTH,
          `Please provide at least ${VALIDATION.MIN_LEAVE_REASON_LENGTH} characters.`
        ),
      startDate: z.date({ message: "Start date is required." }),
      endDate: z.date({ message: "End date is required." }),
      durationType: z.string().min(1, "Please select a duration type."),
      halfDaySegment: z.string().optional(),
    })
    .refine((data) => data.endDate >= data.startDate, {
      message: "End date must be on or after the start date.",
      path: ["endDate"],
    });

  const adminApplyLeaveForm = useForm<z.infer<typeof adminApplyLeaveFormSchema>>({
    resolver: zodResolver(adminApplyLeaveFormSchema),
    defaultValues: {
      leaveType: "",
      reason: "",
      startDate: undefined,
      endDate: undefined,
      durationType: "",
      halfDaySegment: "",
    },
  });

  const durationTypes = mockDataService.getDurationTypes();

  const leavesPageSize = 10;

  const fetchBalances = useCallback(async () => {
    setIsBalancesLoading(true);
    try {
      const res = await apiClient.get(API_PATHS.LEAVES_BALANCES);
      setBalances(Array.isArray(res.data?.balances) ? res.data.balances : []);
    } catch {
      setBalances([]);
    } finally {
      setIsBalancesLoading(false);
    }
  }, []);

  const fetchMyLeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(API_PATHS.LEAVES_REQUESTS_GET);
      setLeaveHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load leave history");
      setLeaveHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTeamLeaves = useCallback(async () => {
    if (!canUseLeaveSearch) {
      setTeamLeaveHistory([]);
      setIsTeamLoading(false);
      return;
    }

    setIsTeamLoading(true);
    try {
      const res = await apiClient.get(API_PATHS.LEAVES_TEAM_REQUESTS_GET);
      setTeamLeaveHistory(
        Array.isArray(res.data) ? (res.data as TeamLeaveRequest[]) : []
      );
    } catch {
      setTeamLeaveHistory([]);
    } finally {
      setIsTeamLoading(false);
    }
  }, [canUseLeaveSearch]);

  const fetchEmployeeEmailSuggestions = useCallback(
    async (query: string): Promise<SearchComboboxOption[]> => {
      if (!user?.orgId || !canUseLeaveSearch) return [];

      try {
        const params: Record<string, any> = {
          orgId: user.orgId,
          q: query,
          page: 1,
          limit: 8,
        };

        if (isReportingManagerOnly && user?.id) {
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
            if (isReportingManagerOnly) {
              return Number(item?.managerId) === Number(user?.id);
            }
            return true;
          })
          .map((item: any) => ({
            value: String(item?.email ?? "").trim(),
            label: String(item?.name ?? item?.email ?? "").trim(),
            description: String(item?.email ?? "").trim(),
          }))
          .filter((item: SearchComboboxOption) => Boolean(item.value));
      } catch {
        return [];
      }
    },
    [canUseLeaveSearch, isReportingManagerOnly, user?.id, user?.orgId]
  );

  const validateManagerHierarchyAccess = useCallback(
    async (rawEmail: string) => {
      if (!isReportingManagerOnly || !user?.orgId || !user?.id) {
        return true;
      }

      const email = rawEmail.trim().toLowerCase();
      if (!email) return false;

      const res = await apiClient.get(API_PATHS.EMPLOYEES, {
        params: {
          orgId: user.orgId,
          q: email,
          managerId: user.id,
          page: 1,
          limit: 20,
        },
      });

      const responseData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      const items = Array.isArray(responseData)
        ? responseData
        : responseData.data || [];

      return items.some(
        (item: any) =>
          String(item?.email ?? "").trim().toLowerCase() === email &&
          Number(item?.managerId) === Number(user.id)
      );
    },
    [isReportingManagerOnly, user?.id, user?.orgId]
  );

  useEffect(() => {
    fetchBalances();
    fetchMyLeaves();
    fetchTeamLeaves();
  }, [fetchBalances, fetchMyLeaves, fetchTeamLeaves]);

  const persistLeavesState = useCallback((nextState: PersistedLeavesState) => {
    if (typeof window === "undefined") return;

    const currentState = (window.history.state ?? {}) as Record<string, unknown>;
    const existingLeavesState =
      (currentState.__leavesState as PersistedLeavesState | undefined) ?? {};

    window.history.replaceState(
      {
        ...currentState,
        __leavesState: {
          ...existingLeavesState,
          ...nextState,
        },
      },
      "",
      window.location.pathname
    );
  }, []);

  useEffect(() => {
    if (!adminApplyLeaveOpen) return;
    let isMounted = true;
    async function fetchLeaveTypesForAdmin() {
      try {
        const res = await apiClient.get(API_PATHS.LEAVES_TYPES);
        const types = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        if (isMounted) {
          setAdminLeaveTypes(types);
        }
      } catch {
        if (isMounted) {
          setAdminLeaveTypes([]);
        }
      }
    }
    fetchLeaveTypesForAdmin();
    return () => {
      isMounted = false;
    };
  }, [adminApplyLeaveOpen]);

  const handleNewRequestSuccess = useCallback(() => {
    fetchBalances();
    fetchMyLeaves();
  }, [fetchBalances, fetchMyLeaves]);

  const handleAdminApplyLeaveSubmit = useCallback(
    async (values: z.infer<typeof adminApplyLeaveFormSchema>) => {
      if (!selectedTeamEmployeeUserId) {
        toast.error("Please select an employee first");
        return;
      }

      setAdminApplyLeaveSubmitting(true);
      try {
        const selectedLeaveType = adminLeaveTypes.find(
          (t) => t.id === parseInt(values.leaveType)
        );
        if (!selectedLeaveType) {
          toast.error("Invalid leave type selected");
          setAdminApplyLeaveSubmitting(false);
          return;
        }

        const start = new Date(values.startDate);
        const end = new Date(values.endDate);
        const days =
          Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const hours =
          values.durationType === "full_day" ? days * 8 : days * 4;

        const payload: Record<string, unknown> = {
          userId: selectedTeamEmployeeUserId,
          leaveTypeId: selectedLeaveType.id,
          startDate: format(values.startDate, DATE_FORMATS.API),
          endDate: format(values.endDate, DATE_FORMATS.API),
          hours,
          reason: values.reason,
          durationType: values.durationType,
        };
        if (values.durationType === "half_day" && values.halfDaySegment) {
          payload.halfDaySegment = values.halfDaySegment;
        }

        const response = await apiClient.post(
          API_PATHS.LEAVES_ADMIN_APPLY,
          payload
        );
        if (response.status === 200 || response.status === 201) {
          toast.success(`Leave applied successfully for ${selectedTeamEmployeeEmail}!`);
          invalidateMonthlyTimesheetCache(
            values.startDate.getFullYear(),
            values.startDate.getMonth() + 1
          );
          if (values.startDate.getMonth() !== values.endDate.getMonth()) {
            invalidateMonthlyTimesheetCache(
              values.endDate.getFullYear(),
              values.endDate.getMonth() + 1
            );
          }
          adminApplyLeaveForm.reset({
            leaveType: "",
            reason: "",
            startDate: undefined,
            endDate: undefined,
            durationType: "",
            halfDaySegment: "",
          });
          setAdminLeaveDateRange(undefined);
          setIsAdminDatePickerOpen(false);
          setAdminLeaveValidationError(null);
          setAdminApplyLeaveOpen(false);
          fetchTeamLeaves();
        }
      } catch (error: unknown) {
        const msg =
          typeof error === "object" &&
            error !== null &&
            "response" in error &&
            (error as { response?: { data?: { message?: string } } }).response?.data
              ?.message
            ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
            : error instanceof Error
              ? error.message
              : "Failed to apply leave.";
        toast.error("Submission failed", { description: msg });
      } finally {
        setAdminApplyLeaveSubmitting(false);
      }
    },
    [selectedTeamEmployeeUserId, selectedTeamEmployeeEmail, adminLeaveTypes, adminApplyLeaveForm, fetchTeamLeaves]
  );

  const openAdminApplyLeaveDialog = useCallback(() => {
    if (!selectedTeamEmployeeUserId || !selectedTeamEmployeeEmail) {
      toast.error("Please search for an employee first");
      return;
    }
    setAdminApplyLeaveOpen(true);
  }, [selectedTeamEmployeeUserId, selectedTeamEmployeeEmail]);

  useEffect(() => {
    if (adminLeaveDateRange?.from && adminLeaveDateRange?.to) {
      adminApplyLeaveForm.setValue("startDate", adminLeaveDateRange.from);
      adminApplyLeaveForm.setValue("endDate", adminLeaveDateRange.to);
    } else if (adminLeaveDateRange?.from && !adminLeaveDateRange?.to) {
      adminApplyLeaveForm.setValue("startDate", adminLeaveDateRange.from);
      adminApplyLeaveForm.setValue("endDate", adminLeaveDateRange.from);
    }
  }, [adminLeaveDateRange, adminApplyLeaveForm]);

  // Internal search function that only fetches data
  const fetchEmployeeLeaveBalance = useCallback(async (email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return false;
    }

    if (!canUseLeaveSearch) {
      toast.error("You are not allowed to search employee balances");
      return false;
    }

    setIsTeamEmployeeBalanceLoading(true);
    try {
      const hasHierarchyAccess = await validateManagerHierarchyAccess(
        trimmedEmail
      );

      if (!hasHierarchyAccess) {
        setTeamEmployeeBalances([]);
        setSelectedTeamEmployeeEmail("");
        setSelectedTeamEmployeeUserId(null);
        toast.error("You can view balances only for your direct reportees.");
        return false;
      }

      const params: Record<string, unknown> = { email: trimmedEmail };
      if (isReportingManagerOnly && user?.id) {
        params.managerId = user.id;
      }

      const response = await apiClient.get(API_PATHS.LEAVES_BALANCES_EMPLOYEE, {
        params,
      });

      const parsedBalances = Array.isArray(response.data?.balances)
        ? response.data.balances
        : Array.isArray(response.data?.data?.balances)
          ? response.data.data.balances
          : [];

      // Try to get userId from response
      const userId = response.data?.userId || response.data?.data?.userId || response.data?.user?.id || (parsedBalances[0]?.userId) || null;

      setTeamEmployeeBalances(parsedBalances);
      setSelectedTeamEmployeeEmail(trimmedEmail);
      setSelectedTeamEmployeeUserId(userId);
      return true;
    } catch {
      setTeamEmployeeBalances([]);
      setSelectedTeamEmployeeEmail("");
      setSelectedTeamEmployeeUserId(null);
      toast.error("Unable to load employee leave balance");
      return false;
    } finally {
      setIsTeamEmployeeBalanceLoading(false);
    }
  }, [
    canUseLeaveSearch,
    isReportingManagerOnly,
    user?.id,
    validateManagerHierarchyAccess,
  ]);

  // Restore team balance state from browser history on refresh
  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentState = (window.history.state ?? {}) as Record<string, unknown>;
    const leavesState =
      (currentState.__leavesState as PersistedLeavesState | undefined) ?? {};

    if (leavesState.activeMainTab && (leavesState.activeMainTab !== "team" || canUseLeaveSearch)) {
      setActiveMainTab(leavesState.activeMainTab);
    }

    if (canUseLeaveSearch && leavesState.isTeamEmployeeBalanceView) {
      setIsTeamEmployeeBalanceView(true);
      setShowTeamEmployeeBalanceSearch(true);
      setActiveMainTab("team");
    }

    if (canUseLeaveSearch && leavesState.teamEmployeeEmail) {
      setTeamEmployeeBalanceEmail(leavesState.teamEmployeeEmail);
      void fetchEmployeeLeaveBalance(leavesState.teamEmployeeEmail);
    }
  }, [canUseLeaveSearch, fetchEmployeeLeaveBalance]);

  useEffect(() => {
    if (canUseLeaveSearch) return;

    if (activeMainTab === "team") {
      setActiveMainTab("leaves");
    }

    if (isTeamEmployeeBalanceView) {
      setIsTeamEmployeeBalanceView(false);
      setShowTeamEmployeeBalanceSearch(false);
    }
  }, [activeMainTab, canUseLeaveSearch, isTeamEmployeeBalanceView]);

  useEffect(() => {
    persistLeavesState({ activeMainTab });
  }, [activeMainTab, persistLeavesState]);

  const searchTeamEmployeeBalanceByEmail = useCallback(async (rawEmail: string) => {
    if (!canUseLeaveSearch) {
      toast.error("You are not allowed to search employee balances");
      return;
    }

    const email = rawEmail.trim();
    if (!email) {
      toast.error("Please enter employee email");
      return;
    }

    const success = await fetchEmployeeLeaveBalance(email);
    if (success) {
      setActiveMainTab("team");
      setIsTeamEmployeeBalanceView(true);
      setShowTeamEmployeeBalanceSearch(true);
      persistLeavesState({
        activeMainTab: "team",
        isTeamEmployeeBalanceView: true,
        teamEmployeeEmail: email,
      });
    }
  }, [canUseLeaveSearch, fetchEmployeeLeaveBalance, persistLeavesState]);

  const handleSearchTeamEmployeeBalance = useCallback(async () => {
    await searchTeamEmployeeBalanceByEmail(teamEmployeeBalanceEmail);
  }, [searchTeamEmployeeBalanceByEmail, teamEmployeeBalanceEmail]);

  const clearTeamEmployeeBalanceSearch = useCallback(() => {
    // Clear search field and data, but keep search interface visible
    setTeamEmployeeBalanceEmail("");
    setSelectedTeamEmployeeEmail("");
    setSelectedTeamEmployeeUserId(null);
    setTeamEmployeeBalances([]);

    persistLeavesState({
      activeMainTab: "team",
      isTeamEmployeeBalanceView: true,
      teamEmployeeEmail: "",
    });
  }, [persistLeavesState]);

  const backToTeamLeaves = useCallback(() => {
    setIsTeamEmployeeBalanceView(false);
    setShowTeamEmployeeBalanceSearch(false);
    persistLeavesState({
      activeMainTab: "team",
      isTeamEmployeeBalanceView: false,
      teamEmployeeEmail: teamEmployeeBalanceEmail,
    });
  }, [persistLeavesState, teamEmployeeBalanceEmail]);

  const handleUpdateAllocatedBalance = useCallback(async () => {
    if (!editingAllocatedBalance || !selectedTeamEmployeeUserId) return;

    const newAllocatedHours = parseFloat(editingAllocatedHours);
    if (isNaN(newAllocatedHours) || newAllocatedHours < 0) {
      toast.error("Please enter a valid number");
      return;
    }

    setIsUpdatingAllocated(true);
    try {
      await apiClient.patch(API_PATHS.LEAVES_ADMIN_BALANCES_UPDATE, {
        userId: selectedTeamEmployeeUserId,
        leaveTypeId: editingAllocatedBalance.leaveTypeId,
        allocatedHours: newAllocatedHours * 8,
      });

      toast.success("Allocated balance updated successfully");

      // Update the local state with the new balance
      setTeamEmployeeBalances((prev) =>
        prev.map((balance) =>
          balance.id === editingAllocatedBalance.id
            ? { ...balance, allocatedHours: newAllocatedHours * 8 }
            : balance
        )
      );

      setEditingAllocatedBalance(null);
      setEditingAllocatedHours("");
    } catch {
      toast.error("Failed to update allocated balance");
    } finally {
      setIsUpdatingAllocated(false);
    }
  }, [editingAllocatedBalance, editingAllocatedHours, selectedTeamEmployeeUserId])

  const visibleBalances = useMemo(() => {
    return balances.filter((balance) => {
      const leaveName = String(balance.leaveType?.name ?? "").trim().toLowerCase();
      const leaveCode = String(balance.leaveType?.code ?? "").trim().toLowerCase();

      const isCompensatoryLeave =
        leaveName === "compensatory leave" ||
        leaveCode === "compensatory_leave" ||
        leaveCode === "compensatory-leave" ||
        leaveCode === "compensatory";

      return !isCompensatoryLeave;
    });
  }, [balances]);

  // Summary stats from balances
  const summaryStats = useMemo(() => {
    const allocated = visibleBalances.reduce((sum, b) => sum + b.allocatedHours / 8, 0);
    const available = visibleBalances.reduce((sum, b) => sum + b.balanceHours / 8, 0);
    const pending = visibleBalances.reduce((sum, b) => sum + b.pendingHours / 8, 0);
    const approved = visibleBalances.reduce((sum, b) => sum + b.bookedHours / 8, 0);
    return {
      available,
      allocated,
      pending,
      approved,
    };
  }, [visibleBalances]);

  // Filtered leave requests
  const filteredLeaves = useMemo(() => {
    const fromStr = filterDateRange?.from ? format(filterDateRange.from, "yyyy-MM-dd") : "";
    const toStr = filterDateRange?.to ? format(filterDateRange.to, "yyyy-MM-dd") : (filterDateRange?.from ? format(filterDateRange.from, "yyyy-MM-dd") : "");
    return leaveHistory.filter((leave) => {
      const matchesSearch =
        !searchQuery ||
        leave.leaveType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.reason.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || leave.state === statusFilter;
      const matchesFrom = !fromStr || leave.startDate >= fromStr;
      const matchesTo = !toStr || leave.endDate <= toStr;
      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
  }, [leaveHistory, searchQuery, statusFilter, filterDateRange]);

  const leavesTotal = filteredLeaves.length;
  const leavesTotalPages = Math.max(1, Math.ceil(leavesTotal / leavesPageSize));
  const paginatedLeaves = useMemo(() => {
    const start = (leavesPage - 1) * leavesPageSize;
    return filteredLeaves.slice(start, start + leavesPageSize);
  }, [filteredLeaves, leavesPage, leavesPageSize]);

  useEffect(() => {
    setLeavesPage(1);
  }, [filteredLeaves, leavesPageSize]);

  useEffect(() => {
    setLeavesPage((prev) => Math.min(prev, leavesTotalPages));
  }, [leavesTotalPages]);

  // Team leaves by state
  const teamPending = useMemo(
    () => teamLeaveHistory.filter((l) => l.state === "pending"),
    [teamLeaveHistory]
  );
  const teamApproved = useMemo(
    () => teamLeaveHistory.filter((l) => l.state === "approved"),
    [teamLeaveHistory]
  );
  const teamRejected = useMemo(
    () => teamLeaveHistory.filter((l) => l.state === "rejected"),
    [teamLeaveHistory]
  );
  const filteredTeamPending = useMemo(() => {
    if (!teamSearch.trim()) return teamPending;
    const q = teamSearch.toLowerCase();
    return teamPending.filter(
      (l) =>
        (l.user?.name ?? "").toLowerCase().includes(q) ||
        (l.user?.email ?? "").toLowerCase().includes(q)
    );
  }, [teamPending, teamSearch]);

  const filteredTeamApproved = useMemo(() => {
    if (!teamSearch.trim()) return teamApproved;
    const q = teamSearch.toLowerCase();
    return teamApproved.filter(
      (l) =>
        (l.user?.name ?? "").toLowerCase().includes(q) ||
        (l.user?.email ?? "").toLowerCase().includes(q)
    );
  }, [teamApproved, teamSearch]);

  const filteredTeamRejected = useMemo(() => {
    if (!teamSearch.trim()) return teamRejected;
    const q = teamSearch.toLowerCase();
    return teamRejected.filter(
      (l) =>
        (l.user?.name ?? "").toLowerCase().includes(q) ||
        (l.user?.email ?? "").toLowerCase().includes(q)
    );
  }, [teamRejected, teamSearch]);

  const teamTotal = filteredTeamApproved.length;
  const teamTotalPages = Math.max(1, Math.ceil(teamTotal / teamPageSize));
  const paginatedTeamApproved = useMemo(() => {
    const start = (teamPage - 1) * teamPageSize;
    return filteredTeamApproved.slice(start, start + teamPageSize);
  }, [filteredTeamApproved, teamPage, teamPageSize]);

  useEffect(() => {
    setTeamPage(1);
  }, [filteredTeamApproved, teamPageSize]);

  // Sorted balances (casual/wellness first)
  const sortedBalances = useMemo(() => {
    const priority = ["casual leave", "wellness leave"];
    return [...visibleBalances].sort((a, b) => {
      const aKey = (a.leaveType?.name || "").toLowerCase();
      const bKey = (b.leaveType?.name || "").toLowerCase();
      const ai = priority.findIndex((p) => aKey.includes(p));
      const bi = priority.findIndex((p) => bKey.includes(p));
      return (
        (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi) ||
        aKey.localeCompare(bKey)
      );
    });
  }, [visibleBalances]);

  const sortedTeamEmployeeBalances = useMemo(() => {
    const priority = ["casual leave", "wellness leave"];
    return teamEmployeeBalances
      .filter((balance) => {
        const leaveName = String(balance.leaveType?.name ?? "").trim().toLowerCase();
        const leaveCode = String(balance.leaveType?.code ?? "").trim().toLowerCase();

        const isCompensatoryLeave =
          leaveName === "compensatory leave" ||
          leaveCode === "compensatory_leave" ||
          leaveCode === "compensatory-leave" ||
          leaveCode === "compensatory";

        return !isCompensatoryLeave;
      })
      .sort((a, b) => {
        const aKey = (a.leaveType?.name || "").toLowerCase();
        const bKey = (b.leaveType?.name || "").toLowerCase();
        const ai = priority.findIndex((p) => aKey.includes(p));
        const bi = priority.findIndex((p) => bKey.includes(p));
        return (
          (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi) ||
          aKey.localeCompare(bKey)
        );
      });
  }, [teamEmployeeBalances]);

  const formatLeaveDaysValue = (days: number) => {
    const normalized = Math.round((days + Number.EPSILON) * 100) / 100;
    return Number.isInteger(normalized)
      ? String(normalized)
      : String(normalized)
        .replace(/\.0+$/, "")
        .replace(/(\.\d*[1-9])0+$/, "$1");
  };

  const formatDays = (leave: LeaveRequest) => {
    const days = leave.hours / 8;
    return `${formatLeaveDaysValue(days)}d`;
  };

  const hasFilters = searchQuery || statusFilter !== "all" || filterDateRange;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setFilterDateRange(undefined);
  };

  const getStatusBadge = (state: string) => {
    const configs = {
      pending: { dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "Pending" },
      approved: { dot: "bg-emerald-400", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", label: "Approved" },
      rejected: { dot: "bg-red-400", text: "text-red-700", bg: "bg-red-50 border-red-200", label: "Declined" },
    };
    const c = configs[state as keyof typeof configs] ?? configs.rejected;
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium", c.bg, c.text)}>
        <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
        {c.label}
      </span>
    );
  };

  const getDisplayLeaveTypeName = (name: string) => {
    const normalizedName = name.trim().toLowerCase();
    if (normalizedName === "comp off") {
      return "Compensatory Leave";
    }
    return name;
  };

  const currentYear = new Date().getFullYear();
  const fyLabel = `FY ${currentYear - 1}–${String(currentYear).slice(-2)}`;

  const statCards = [
    {
      label: "Available",
      value: summaryStats.available,
      icon: TreePalm,
      accent: "border-l-[#8a6f5e]",
      iconBg: "bg-[#f0ebe3]",
      iconColor: "text-[#8a6f5e]",
      valueColor: "text-[#4a5548]",
    },
    {
      label: "Allocated",
      value: summaryStats.allocated,
      icon: CalendarIcon,
      accent: "border-l-[#748074]",
      iconBg: "bg-[#e5eeea]",
      iconColor: "text-[#748074]",
      valueColor: "text-[#4a5548]",
    },
    {
      label: "Pending",
      value: summaryStats.pending,
      icon: Clock,
      accent: "border-l-amber-400",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      valueColor: "text-amber-700",
    },
    {
      label: "Approved",
      value: summaryStats.approved,
      icon: CheckCircle2,
      accent: "border-l-emerald-400",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-700",
    },
  ];

  return (
    <>
      <AppHeader crumbs={[{ label: "Leaves" }]} />
      <PageWrapper>
        <div className="p-4 md:p-6 space-y-6">
          {/* Page header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">Leave Management</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track and manage your time off</p>
            </div>
            <NewLeaveRequestDialog
              userEmail={user?.email ?? ""}
              onSuccess={handleNewRequestSuccess}
            />
          </div>

          <Tabs
            value={activeMainTab}
            onValueChange={(value) => {
              if (value === "team" && !canUseLeaveSearch) {
                setActiveMainTab("leaves");
                return;
              }
              setActiveMainTab(value as LeavesMainTab);
            }}
            className="w-full"
          >
            {/* Tab navigation — segmented pill style */}
            <TabsList className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary-background p-1 h-auto mb-6">
              {[
                { value: "leaves", label: "My Leaves" },
                { value: "balance", label: "My Leave Balance" },
                ...(canUseLeaveSearch
                  ? ([{ value: "team", label: "Team" }] as const)
                  : []),
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
                    "text-muted-foreground hover:text-foreground",
                    "border border-transparent",
                    "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-border data-[state=active]:shadow-sm",
                    "focus-visible:outline-none"
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── MY LEAVES TAB ── */}
            <TabsContent value="leaves" className="space-y-6 mt-0">
              {/* Summary stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {statCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.label}
                      className={cn(
                        "bg-background border border-border rounded-lg p-4 border-l-4 transition-shadow hover:shadow-sm",
                        card.accent
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {card.label}
                        </span>
                        <span className={cn("p-1.5 rounded-md", card.iconBg)}>
                          <Icon className={cn("h-3.5 w-3.5", card.iconColor)} />
                        </span>
                      </div>
                      {isBalancesLoading ? (
                        <div className="h-8 w-16 bg-secondary-background rounded animate-pulse" />
                      ) : (
                        <p className={cn("text-2xl font-bold tabular-nums", card.valueColor)}>
                          {formatLeaveDaysValue(card.value)}
                          <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
                        </p>
                      )}
                      {/* <p className="text-xs text-muted-foreground mt-1">{card.sub}</p> */}
                    </div>
                  );
                })}
              </div>

              {/* Filters row */}
              <div className="flex flex-wrap items-center gap-2">
                {canUseLeaveSearch && (
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search leave type or reason..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 bg-background text-sm font-base"
                    />
                  </div>
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 gap-2 min-w-[200px] justify-start text-sm font-base",
                        !filterDateRange?.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                      {filterDateRange?.from ? (
                        filterDateRange.to ? (
                          <>
                            {format(filterDateRange.from, "d MMM yyyy")}
                            {" — "}
                            {format(filterDateRange.to, "d MMM yyyy")}
                          </>
                        ) : (
                          format(filterDateRange.from, "d MMM yyyy")
                        )
                      ) : (
                        "Filter by date range"
                      )}
                      {filterDateRange?.from && (
                        <span
                          role="button"
                          className="ml-auto h-4 w-4 rounded-full flex items-center justify-center hover:bg-secondary-background"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterDateRange(undefined);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-0" align="start">
                    <Calendar
                      mode="range"
                      defaultMonth={filterDateRange?.from}
                      selected={filterDateRange}
                      onSelect={setFilterDateRange}
                      numberOfMonths={2}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-[130px] bg-background text-foreground border-border text-sm font-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Declined</SelectItem>
                  </SelectContent>
                </Select>
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={clearFilters}
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear all
                  </Button>
                )}
              </div>

              {/* Leave requests table */}
              <div className="rounded-lg border border-border overflow-hidden bg-background">
                <div className="px-4 py-3 border-b border-border bg-secondary-background flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Leave Requests</span>
                  {!isLoading && (
                    <span className="text-xs text-muted-foreground">
                      {filteredLeaves.length} {filteredLeaves.length === 1 ? "record" : "records"}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">#</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Period</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            {Array.from({ length: 6 }).map((_, j) => (
                              <td key={j} className="px-4 py-3.5">
                                <div className="h-4 bg-secondary-background rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : filteredLeaves.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <TreePalm className="h-8 w-8 text-muted-foreground/40" />
                              <p className="text-sm text-muted-foreground">No leave records found</p>
                              {hasFilters && (
                                <button onClick={clearFilters} className="text-xs text-foreground underline underline-offset-2">
                                  Clear filters
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedLeaves.map((leave, idx) => (
                          <tr
                            key={leave.id}
                            className="border-b border-border last:border-0 hover:bg-secondary-background/60 transition-colors"
                          >
                            <td className="px-4 py-3.5 text-xs text-muted-foreground tabular-nums">
                              {(leavesPage - 1) * leavesPageSize + idx + 1}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="font-medium text-foreground">{getDisplayLeaveTypeName(leave.leaveType.name)}</span>
                            </td>
                            <td className="px-4 py-3.5 text-foreground">
                              <span>{format(parseISO(leave.startDate), "d MMM yyyy")}</span>
                              {leave.startDate !== leave.endDate && (
                                <>
                                  <span className="mx-1.5 text-muted-foreground">→</span>
                                  <span>{format(parseISO(leave.endDate), "d MMM yyyy")}</span>
                                </>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="inline-flex items-center justify-center min-w-[2.5rem] rounded-md bg-secondary-background border border-border px-2 py-0.5 text-xs font-semibold text-foreground tabular-nums">
                                {formatDays(leave)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground max-w-[220px] truncate text-sm">
                              {leave.reason}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              {getStatusBadge(leave.state)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {!isLoading && filteredLeaves.length > 0 && leavesTotalPages > 1 && (
                  <div className="px-4 py-3 border-t border-border bg-secondary-background flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                      Showing {(leavesPage - 1) * leavesPageSize + 1}-
                      {Math.min(leavesPage * leavesPageSize, leavesTotal)} of {leavesTotal}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLeavesPage((p) => Math.max(1, p - 1))}
                        disabled={leavesPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLeavesPage((p) => Math.min(leavesTotalPages, p + 1))}
                        disabled={leavesPage === leavesTotalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── LEAVE BALANCE TAB ── */}
            <TabsContent value="balance" className="mt-0">
              <div className="rounded-lg border border-border overflow-hidden bg-background">
                <div className="px-5 py-4 border-b border-border bg-secondary-background flex flex-wrap items-start gap-y-2 justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Leave Balance</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
                      Healthy
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
                      Low
                    </span>
                  </div>
                </div>

                {isBalancesLoading ? (
                  <div className="p-5 space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="h-4 w-40 bg-secondary-background rounded animate-pulse" />
                        <div className="h-4 flex-1 bg-secondary-background rounded animate-pulse" />
                        <div className="h-4 w-16 bg-secondary-background rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {sortedBalances.map((balance) => {
                      const allocated = balance.allocatedHours / 8;
                      const remaining = balance.balanceHours / 8;
                      const pending = balance.pendingHours / 8;
                      const approved = balance.bookedHours / 8;
                      const pct = allocated > 0 ? Math.round((remaining / allocated) * 100) : 0;
                      const isLow = pct < 50;

                      return (
                        <div key={balance.id} className="px-5 py-4 hover:bg-secondary-background/40 transition-colors">
                          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
                            {/* Leave type name */}
                            <div className="flex items-center gap-2 sm:w-44 sm:flex-shrink-0">
                              <span className="text-sm font-medium text-foreground">{getDisplayLeaveTypeName(balance.leaveType.name)}</span>
                              {balance.leaveType.paid && (
                                <span className="text-[10px] font-medium text-[#748074] bg-[#e5eeea] rounded px-1.5 py-0.5">Paid</span>
                              )}
                            </div>

                            {/* Progress bar */}
                            <div className="flex-1 flex items-center gap-3 min-w-0">
                              <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    isLow ? "bg-amber-400" : "bg-emerald-400"
                                  )}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">{pct}%</span>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 sm:gap-5 text-sm sm:flex-shrink-0">
                              <div className="text-center min-w-[2.5rem]">
                                <p className={cn("font-semibold tabular-nums", isLow ? "text-amber-600" : "text-emerald-600")}>
                                  {formatLeaveDaysValue(remaining)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">remaining</p>
                              </div>
                              <div className="text-center min-w-[2.5rem]">
                                <p className="font-medium text-foreground tabular-nums">{formatLeaveDaysValue(allocated)}</p>
                                <p className="text-[10px] text-muted-foreground">allocated</p>
                              </div>
                              {pending > 0 && (
                                <div className="text-center min-w-[2.5rem]">
                                  <p className="font-medium text-amber-600 tabular-nums">{formatLeaveDaysValue(pending)}</p>
                                  <p className="text-[10px] text-muted-foreground">pending</p>
                                </div>
                              )}
                              {approved > 0 && (
                                <div className="text-center min-w-[2.5rem]">
                                  <p className="font-medium text-muted-foreground tabular-nums">{formatLeaveDaysValue(approved)}</p>
                                  <p className="text-[10px] text-muted-foreground">taken</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── TEAM MANAGEMENT TAB ── */}
            {canUseLeaveSearch && (
            <TabsContent value="team" className="mt-0">
              <Tabs defaultValue="pending" className="w-full">
                {/* Inner tab bar for team sub-tabs */}
                <div className="flex items-center justify-between mb-5 border-b border-border">
                  {!isTeamEmployeeBalanceView && (
                    <div className="flex items-center gap-1">
                      {[
                        { val: "pending", label: "Pending", count: filteredTeamPending.length, activeColor: "data-[state=active]:text-amber-700 data-[state=active]:border-amber-500" },
                        { val: "approved", label: "Approved", count: filteredTeamApproved.length, activeColor: "data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-500" },
                        { val: "rejected", label: "Rejected", count: filteredTeamRejected.length, activeColor: "data-[state=active]:text-red-700 data-[state=active]:border-red-500" },
                      ].map(({ val, label, count, activeColor }) => (
                        <TabsList key={val} className="h-auto p-0 bg-transparent border-0 rounded-none">
                          <TabsTrigger
                            value={val}
                            className={cn(
                              "rounded-none px-4 pb-3 pt-1 text-sm font-medium bg-transparent shadow-none",
                              "border-b-2 border-transparent -mb-px",
                              "text-muted-foreground hover:text-foreground transition-colors",
                              "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                              activeColor
                            )}
                          >
                            {label}
                            <span
                              className={cn(
                                "ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                                val === "pending" ? "bg-amber-50 text-amber-700" :
                                  val === "approved" ? "bg-emerald-50 text-emerald-700" :
                                    "bg-red-50 text-red-700"
                              )}
                            >
                              {count}
                            </span>
                          </TabsTrigger>
                        </TabsList>
                      ))}
                    </div>
                  )}

                  {/* Right-side search for team name / email */}
                  <div className="ml-4">
                    <div className="flex items-center gap-2">
                      {canUseLeaveSearch && !isTeamEmployeeBalanceView && (
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            placeholder="Search team name or email..."
                            value={teamSearch}
                            onChange={(e) => setTeamSearch(e.target.value)}
                            className="pl-9 h-8 bg-background text-sm min-w-[220px]"
                          />
                        </div>
                      )}
                      {canUseLeaveSearch && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (isTeamEmployeeBalanceView) {
                              backToTeamLeaves();
                              return;
                            }
                            setActiveMainTab("team");
                            setIsTeamEmployeeBalanceView(true);
                            setShowTeamEmployeeBalanceSearch(true);
                            persistLeavesState({
                              activeMainTab: "team",
                              isTeamEmployeeBalanceView: true,
                              teamEmployeeEmail: teamEmployeeBalanceEmail.trim(),
                            });
                          }}
                        >
                          {isTeamEmployeeBalanceView
                            ? "Back to Team Leaves"
                            : "Employee Leave Balance"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {canUseLeaveSearch && isTeamEmployeeBalanceView && showTeamEmployeeBalanceSearch && (
                  <div className="mb-4 rounded-lg border border-border bg-background p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <SearchCombobox
                        value={teamEmployeeBalanceEmail}
                        onValueChange={(nextValue) => {
                          setTeamEmployeeBalanceEmail(nextValue);
                        }}
                        onSelect={(option) => {
                          void searchTeamEmployeeBalanceByEmail(option.value);
                        }}
                        onSubmitValue={(nextValue) => {
                          void searchTeamEmployeeBalanceByEmail(nextValue);
                        }}
                        fetchOptions={fetchEmployeeEmailSuggestions}
                        placeholder="Select employee"
                        searchPlaceholder="Search employee..."
                        emptyMessage="No employee found."
                        minQueryLength={0}
                        className="w-[260px]"
                      />
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => void handleSearchTeamEmployeeBalance()}
                        disabled={isTeamEmployeeBalanceLoading}
                        className="sm:min-w-[92px]"
                      >
                        {isTeamEmployeeBalanceLoading ? "Searching..." : "Search"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearTeamEmployeeBalanceSearch}
                        disabled={isTeamEmployeeBalanceLoading}
                        className="sm:min-w-[72px]"
                      >
                        Clear
                      </Button>
                      {selectedTeamEmployeeEmail && canEditTeamPendingRequests && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={openAdminApplyLeaveDialog}
                          className="sm:min-w-[160px] gap-1.5"
                        >
                          <Plus className="h-4 w-4" />
                          Apply leave for employee
                        </Button>
                      )}
                    </div>

                    {selectedTeamEmployeeEmail && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Showing leave balance for: {selectedTeamEmployeeEmail}
                      </p>
                    )}

                    {selectedTeamEmployeeEmail && (
                      <div className="mt-3 overflow-x-auto rounded-md border border-border">
                        <table className="w-full text-sm min-w-[640px]">
                          <thead>
                            <tr className="border-b border-border bg-secondary-background">
                              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leave Type</th>
                              <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Allocated</th>
                              <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available</th>
                              <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending</th>
                              <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approved</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedTeamEmployeeBalances.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                                  No leave balance found for this employee.
                                </td>
                              </tr>
                            ) : (
                              sortedTeamEmployeeBalances.map((balance) => (
                                <tr key={balance.id} className="border-b border-border last:border-0">
                                  <td className="px-4 py-3 font-medium text-foreground">
                                    {getDisplayLeaveTypeName(balance.leaveType.name)}
                                  </td>
                                  <td className="px-4 py-3 text-center tabular-nums">
                                    {editingAllocatedBalance?.id === balance.id ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <Input
                                          type="number"
                                          inputMode="decimal"
                                          step="0.5"
                                          min="0"
                                          value={editingAllocatedHours}
                                          onChange={(e) => setEditingAllocatedHours(e.target.value)}
                                          className="h-7 w-16 text-center text-sm"
                                          disabled={isUpdatingAllocated}
                                        />
                                        <button
                                          onClick={() => void handleUpdateAllocatedBalance()}
                                          disabled={isUpdatingAllocated}
                                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                                          title="Confirm"
                                        >
                                          <CheckCircle2 className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingAllocatedBalance(null);
                                            setEditingAllocatedHours("");
                                          }}
                                          disabled={isUpdatingAllocated}
                                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                          title="Cancel"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center gap-2">
                                        <span>{formatLeaveDaysValue(balance.allocatedHours / 8)}</span>
                                        {canEditTeamPendingRequests && (
                                          <button
                                            onClick={() => {
                                              setEditingAllocatedBalance(balance);
                                              setEditingAllocatedHours(String(balance.allocatedHours / 8));
                                            }}
                                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                                            title="Edit allocated balance"
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center tabular-nums">
                                    {formatLeaveDaysValue(balance.balanceHours / 8)}
                                  </td>
                                  <td className="px-4 py-3 text-center tabular-nums">
                                    {formatLeaveDaysValue(balance.pendingHours / 8)}
                                  </td>
                                  <td className="px-4 py-3 text-center tabular-nums">
                                    {formatLeaveDaysValue(balance.bookedHours / 8)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {!isTeamEmployeeBalanceView && (
                  <>
                    <TabsContent value="pending" className="mt-0">
                      <DataTable
                        columns={columns}
                        data={filteredTeamPending}
                        onUpdate={fetchTeamLeaves}
                        canEditPendingRequests={canEditTeamPendingRequests}
                      />
                    </TabsContent>
                    <TabsContent value="approved" className="mt-0">
                      <LeaveTable
                        leaves={paginatedTeamApproved}
                        isLoading={isTeamLoading}
                        showEmployee={true}
                        canDeleteApprovedRequests={canEditTeamPendingRequests}
                        onUpdate={fetchTeamLeaves}
                      />
                      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary-background gap-3 mt-2">
                        <div className="text-xs text-muted-foreground">
                          {`0 of ${teamTotal} row(s) selected.`}
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTeamPage((p) => Math.max(1, p - 1))}
                            disabled={teamPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTeamPage((p) => Math.min(teamTotalPages, p + 1))}
                            disabled={teamPage === teamTotalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="rejected" className="mt-0">
                      <LeaveTable
                        leaves={filteredTeamRejected}
                        isLoading={isTeamLoading}
                        showEmployee={true}
                        canDeleteApprovedRequests={false}
                      />
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </TabsContent>
            )}
          </Tabs>
        </div>

      </PageWrapper>

      {/* Admin Apply Leave Dialog */}
      <Dialog
        open={adminApplyLeaveOpen}
        onOpenChange={(nextOpen) => {
          setAdminApplyLeaveOpen(nextOpen);
          if (!nextOpen) {
            setIsAdminDatePickerOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply Leave for Employee</DialogTitle>
            <DialogDescription>
              Apply leave on behalf of {selectedTeamEmployeeEmail}
            </DialogDescription>
          </DialogHeader>

          <Form {...adminApplyLeaveForm}>
            <form
              onSubmit={adminApplyLeaveForm.handleSubmit(handleAdminApplyLeaveSubmit)}
              className="space-y-4 mt-2"
            >
              <FormField
                control={adminApplyLeaveForm.control}
                name="leaveType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="— Select leave type —" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {adminLeaveTypes.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={adminApplyLeaveForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Leave</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide a reason for the leave request..."
                        className="min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={adminApplyLeaveForm.control}
                name="startDate"
                render={() => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Leave Date Range</FormLabel>
                    <Popover
                      modal
                      open={isAdminDatePickerOpen}
                      onOpenChange={setIsAdminDatePickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !adminLeaveDateRange?.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {adminLeaveDateRange?.from ? (
                            adminLeaveDateRange.to ? (
                              <>
                                {format(adminLeaveDateRange.from, DATE_FORMATS.DISPLAY)}{" "}
                                –{" "}
                                {format(adminLeaveDateRange.to, DATE_FORMATS.DISPLAY)}
                              </>
                            ) : (
                              format(adminLeaveDateRange.from, DATE_FORMATS.DISPLAY)
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 border-0"
                        align="start"
                        side="bottom"
                        sideOffset={8}
                        style={{ zIndex: 9999 }}
                      >
                        <Calendar
                          mode="range"
                          defaultMonth={adminLeaveDateRange?.from}
                          selected={adminLeaveDateRange}
                          onSelect={(range) => {
                            setAdminLeaveDateRange(range);
                            if (range?.from && range?.to) {
                              setIsAdminDatePickerOpen(false);
                            }
                          }}
                          numberOfMonths={2}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={adminApplyLeaveForm.control}
                name="durationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="— Select duration —" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {durationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {adminApplyLeaveForm.watch("durationType") === "half_day" && (
                <FormField
                  control={adminApplyLeaveForm.control}
                  name="halfDaySegment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Half Day Segment</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="— Select segment —" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="first_half">First Half</SelectItem>
                          <SelectItem value="second_half">Second Half</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {adminLeaveValidationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{adminLeaveValidationError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAdminApplyLeaveOpen(false)}
                  disabled={adminApplLeaveSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={adminApplLeaveSubmitting}
                >
                  {adminApplLeaveSubmitting ? "Applying..." : "Apply Leave"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

