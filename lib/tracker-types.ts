/**
 * Tracker Types
 * Type definitions for the Activity Tracker feature
 */

/* ============================================ */
/* Project Types                                */
/* ============================================ */

export type ProjectStatus = "active" | "inactive" | "hold" | "completed";

export interface Project {
  id: number;
  name: string;
  code: string;
  status?: ProjectStatus;
}

/* ============================================ */
/* Department Types                             */
/* ============================================ */

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string | null;
}

/* ============================================ */
/* Tracker Component Prop Types                 */
/* ============================================ */

export interface LifelinesCardProps {
  remaining: number;
}

export interface ActivityDateSectionProps {
  form: any;
  calendarOpen: boolean;
  setCalendarOpen: (open: boolean) => void;
  disableInvalidDates: (date: Date) => boolean;
  remaining: number;
}

export interface ProjectEntryCardProps {
  form: any;
  index: number;
  fieldCount: number;
  departments: Department[];
  projectsByDept: Record<string, Project[]>;
  projectSearchQuery: Record<number, string>;
  hoursInput: Record<number, string>;
  onDepartmentChange: (index: number, departmentCode: string) => void;
  onProjectSearchChange: (index: number, value: string) => void;
  onHoursInputChange: (index: number, value: string) => void;
  onHoursBlur: (index: number, perProjectMax: number, isAdHoc: boolean) => void;
  onRemove: (index: number) => void;
}

export interface ProjectEntriesSectionProps {
  form: any;
  fields: Array<{ id: string }>;
  fieldCount: number;
  departments: Department[];
  projectsByDept: Record<string, Project[]>;
  projectSearchQuery: Record<number, string>;
  hoursInput: Record<number, string>;
  onDepartmentChange: (index: number, departmentCode: string) => void;
  onProjectSearchChange: (index: number, value: string) => void;
  onHoursInputChange: (index: number, value: string) => void;
  onHoursBlur: (index: number, perProjectMax: number, isAdHoc: boolean) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

export interface TrackerFormProps {
  form: any;
  onSubmit: (values: any) => void | Promise<void>;
  isSubmitting: boolean;
  children: React.ReactNode;
}
