// Dashboard Types - Centralized type definitions for dashboard components

export interface TimesheetEntry {
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

export interface LeaveEntry {
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

export interface DayData {
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

export interface MonthlyTimesheetResponse {
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
    paidLeaves: number;
    totalCompOffLeaveTaken: number;
    totalPayableDays: number;
  };
  days: DayData[];
}

export interface TimesheetRow {
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

export interface ProjectOption {
  id: number;
  name: string;
}

export interface DepartmentOption {
  id: number;
  name: string;
  code: string;
}

export type TeamVisibilityScope = "my_reportees" | "all_org";

export type ProjectPillTone = "green" | "yellow" | "red" | "khaki";
