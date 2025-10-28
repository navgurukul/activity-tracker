/**
 * Mock Data Service
 * Centralized location for all mock/placeholder data used across the application.
 * This data will be replaced with actual API calls in production.
 */

import { AllocatedLeave } from "@/app/(authenticated)/leaves/application/_components/AllocatedLeavesTable";

// =============================================================================
// User Mock Data
// =============================================================================

export interface MockUser {
  email: string;
  name: string;
  department: string;
}

/**
 * Mock user data for development and testing
 * In production, this will be fetched from auth context
 */
export const MOCK_USER: MockUser = {
  email: "john.doe@company.com",
  name: "John Doe",
  department: "Engineering",
};

// =============================================================================
// Leave Management Mock Data
// =============================================================================

export interface LeaveTypeOption {
  value: string;
  label: string;
}

export interface DurationTypeOption {
  value: string;
  label: string;
}

/**
 * Available leave types for leave application
 * In production, this will be fetched from backend API
 */
export const MOCK_LEAVE_TYPES: LeaveTypeOption[] = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "casual", label: "Casual Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
];

/**
 * Duration types for leave requests
 * In production, this may be fetched from backend API
 */
export const MOCK_DURATION_TYPES: DurationTypeOption[] = [
  { value: "full", label: "Full Day" },
  { value: "half", label: "Half Day" },
];

/**
 * User's allocated leave balances
 * In production, this will be fetched from backend API
 */
export const MOCK_ALLOCATED_LEAVES: AllocatedLeave[] = [
  {
    leaveType: "Annual Leave",
    allotted: 20,
    balance: 12,
    booked: 6,
    pending: 2,
  },
  {
    leaveType: "Sick Leave",
    allotted: 10,
    balance: 8,
    booked: 2,
    pending: 0,
  },
  {
    leaveType: "Casual Leave",
    allotted: 12,
    balance: 7,
    booked: 3,
    pending: 2,
  },
  {
    leaveType: "Maternity Leave",
    allotted: 90,
    balance: 90,
    booked: 0,
    pending: 0,
  },
  {
    leaveType: "Paternity Leave",
    allotted: 15,
    balance: 15,
    booked: 0,
    pending: 0,
  },
];

// =============================================================================
// Activity Tracker Mock Data
// =============================================================================

export interface DepartmentOption {
  value: string;
  label: string;
}

export interface ProjectOption {
  value: string;
  label: string;
}

/**
 * Available departments for activity tracking
 * In production, this will be fetched from backend API
 */
export const MOCK_WORKING_DEPARTMENTS: DepartmentOption[] = [
  { value: "engineering", label: "Engineering" },
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "hr", label: "Human Resources" },
];

/**
 * Available projects for activity tracking
 * In production, this will be fetched from backend API
 */
export const MOCK_PROJECTS: ProjectOption[] = [
  { value: "project-a", label: "Project Alpha" },
  { value: "project-b", label: "Project Beta" },
  { value: "project-c", label: "Project Gamma" },
];

// =============================================================================
// Mock Data Service Functions
// =============================================================================

/**
 * Service object for accessing mock data
 * Provides a consistent API that can be easily replaced with real API calls
 */
export const mockDataService = {
  // User data
  getCurrentUser: (): MockUser => MOCK_USER,

  // Leave management
  getLeaveTypes: (): LeaveTypeOption[] => MOCK_LEAVE_TYPES,
  getDurationTypes: (): DurationTypeOption[] => MOCK_DURATION_TYPES,
  getAllocatedLeaves: (): AllocatedLeave[] => MOCK_ALLOCATED_LEAVES,

  // Activity tracker
  getWorkingDepartments: (): DepartmentOption[] => MOCK_WORKING_DEPARTMENTS,
  getProjects: (): ProjectOption[] => MOCK_PROJECTS,
};

/**
 * Type exports for use in components
 */
export type { AllocatedLeave };
