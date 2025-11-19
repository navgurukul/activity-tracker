/**
 * Leave and Timesheet Conflict Validator
 * Handles validation logic for conflicts between leave applications and timesheet entries
 */

import { format } from "date-fns";
import apiClient from "./api-client";
import { API_PATHS, DATE_FORMATS, VALIDATION } from "./constants";

// TypeScript interfaces for API responses
interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  durationType: "full_day" | "half_day";
  halfDaySegment?: "first_half" | "second_half";
  hours: number;
  state: {
    code: string;
    name: string;
  };
}

interface TimesheetEntry {
  id: number;
  projectId: number;
  taskDescription: string;
  hours: number;
}

interface TimesheetDateCheck {
  workDate: string;
  totalHours: number;
  entries: TimesheetEntry[];
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictType?:
    | "full_day_leave"
    | "half_day_leave_hours_exceeded"
    | "timesheet_exists";
  message?: string;
  existingHours?: number;
  maxAllowedHours?: number;
}

/**
 * Check if a leave application conflicts with existing timesheet entries
 * @param startDate - Start date of the leave
 * @param endDate - End date of the leave
 * @param durationType - Type of leave (full_day or half_day)
 * @returns Conflict check result
 */
export async function checkLeaveConflictWithTimesheet(
  startDate: Date,
  endDate: Date,
  durationType: "full_day" | "half_day"
): Promise<ConflictCheckResult> {
  try {
    const startDateStr = format(startDate, DATE_FORMATS.API);
    const endDateStr = format(endDate, DATE_FORMATS.API);

    // For single-day leaves, check that specific date
    if (startDateStr === endDateStr) {
      const response = await apiClient.get<TimesheetDateCheck>(
        API_PATHS.TIMESHEET_CHECK_DATE,
        {
          params: { workDate: startDateStr },
        }
      );

      const timesheetData = response.data;

      // If timesheet exists
      if (timesheetData && timesheetData.totalHours > 0) {
        if (durationType === "full_day") {
          return {
            hasConflict: true,
            conflictType: "timesheet_exists",
            message: `Cannot apply full-day leave. You have already logged ${
              timesheetData.totalHours
            } hours of timesheet entries for ${format(
              startDate,
              DATE_FORMATS.DISPLAY
            )}. Please remove the timesheet entries before applying for leave.`,
            existingHours: timesheetData.totalHours,
          };
        } else if (durationType === "half_day") {
          // For half-day leave, timesheet should not exceed remaining hours
          // Half day = 4 hours, so max timesheet should be 6 hours (allowing some flexibility)
          // But if they already logged full day or more, it's a conflict
          if (
            timesheetData.totalHours > VALIDATION.MAX_HOURS_WITH_HALF_DAY_LEAVE
          ) {
            return {
              hasConflict: true,
              conflictType: "half_day_leave_hours_exceeded",
              message: `Cannot apply half-day leave. You have already logged ${
                timesheetData.totalHours
              } hours for ${format(
                startDate,
                DATE_FORMATS.DISPLAY
              )}, which exceeds the maximum of ${
                VALIDATION.MAX_HOURS_WITH_HALF_DAY_LEAVE
              } hours allowed with a half-day leave. Please adjust your timesheet entries.`,
              existingHours: timesheetData.totalHours,
              maxAllowedHours: VALIDATION.MAX_HOURS_WITH_HALF_DAY_LEAVE,
            };
          }
        }
      }
    } else {
      // For multi-day leaves, check each day in the range
      const currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        const dateStr = format(currentDate, DATE_FORMATS.API);
        const response = await apiClient.get<TimesheetDateCheck>(
          API_PATHS.TIMESHEET_CHECK_DATE,
          {
            params: { workDate: dateStr },
          }
        );

        const timesheetData = response.data;

        if (timesheetData && timesheetData.totalHours > 0) {
          return {
            hasConflict: true,
            conflictType: "timesheet_exists",
            message: `Cannot apply leave. You have timesheet entries for ${format(
              currentDate,
              DATE_FORMATS.DISPLAY
            )} (${
              timesheetData.totalHours
            } hours). Please remove all timesheet entries for the selected date range before applying for leave.`,
            existingHours: timesheetData.totalHours,
          };
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return { hasConflict: false };
  } catch (error: unknown) {
    console.error("Error checking leave-timesheet conflict:", error);
    // If the endpoint returns 404 or no data, assume no timesheet exists (no conflict)
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response &&
      error.response.status === 404
    ) {
      return { hasConflict: false };
    }
    // For other errors, allow the request but log the error
    return { hasConflict: false };
  }
}

/**
 * Check if timesheet entry conflicts with existing leaves
 * @param activityDate - Date of the activity
 * @param totalHours - Total hours being submitted
 * @returns Conflict check result
 */
export async function checkTimesheetConflictWithLeave(
  activityDate: Date,
  totalHours: number
): Promise<ConflictCheckResult> {
  try {
    const dateStr = format(activityDate, DATE_FORMATS.API);

    // Fetch leave requests for the user
    const response = await apiClient.get(API_PATHS.LEAVES_REQUESTS, {
      params: {
        startDate: dateStr,
        endDate: dateStr,
      },
    });

    // Handle wrapped or direct array response
    const leaves: LeaveRequest[] = Array.isArray(response.data)
      ? response.data
      : Array.isArray((response.data as { data?: LeaveRequest[] })?.data)
      ? (response.data as { data: LeaveRequest[] }).data
      : [];

    // Filter for approved or pending leaves that overlap with the activity date
    const relevantLeaves = leaves.filter((leave: LeaveRequest) => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      const actDate = new Date(dateStr);

      // Only consider approved or pending leaves
      const isRelevantState =
        leave.state.code === "approved" || leave.state.code === "pending";

      // Check if activity date falls within leave range
      const isInRange = actDate >= leaveStart && actDate <= leaveEnd;

      return isRelevantState && isInRange;
    });

    if (relevantLeaves.length > 0) {
      const leave = relevantLeaves[0];

      if (leave.durationType === "full_day") {
        return {
          hasConflict: true,
          conflictType: "full_day_leave",
          message: `Cannot submit timesheet. You have a ${
            leave.state.code
          } full-day leave for ${format(
            activityDate,
            DATE_FORMATS.DISPLAY
          )}. Please cancel the leave before submitting timesheet entries.`,
        };
      } else if (leave.durationType === "half_day") {
        // For half-day leave, check if total hours exceed allowed limit
        if (totalHours > VALIDATION.MAX_HOURS_WITH_HALF_DAY_LEAVE) {
          return {
            hasConflict: true,
            conflictType: "half_day_leave_hours_exceeded",
            message: `Cannot submit timesheet. You have a ${
              leave.state.code
            } half-day leave for ${format(
              activityDate,
              DATE_FORMATS.DISPLAY
            )}. Maximum allowed hours for this date is ${
              VALIDATION.MAX_HOURS_WITH_HALF_DAY_LEAVE
            }, but you are trying to submit ${totalHours} hours.`,
            existingHours: totalHours,
            maxAllowedHours: VALIDATION.MAX_HOURS_WITH_HALF_DAY_LEAVE,
          };
        }
      }
    }

    return { hasConflict: false };
  } catch (error: unknown) {
    console.error("Error checking timesheet-leave conflict:", error);
    // If the endpoint returns 404 or no leaves found, assume no conflict
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response &&
      error.response.status === 404
    ) {
      return { hasConflict: false };
    }
    // For other errors, allow the request but log the error
    return { hasConflict: false };
  }
}
