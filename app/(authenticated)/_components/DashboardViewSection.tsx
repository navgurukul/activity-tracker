"use client";

import { CalendarViewComponent } from "@/app/(authenticated)/_components/CalendarViewComponent";
import { ListViewComponent } from "@/app/(authenticated)/_components/ListViewComponent";
import { Button } from "@/components/ui/button";
import { MonthlyTimesheetResponse, TimesheetRow, ProjectPillTone, ProjectOption, DepartmentOption, DayData } from "@/lib/dashboard-type";

interface DashboardViewSectionProps {
  viewMode: "grid" | "table";
  monthlyData: MonthlyTimesheetResponse | null;
  timesheetRows: TimesheetRow[];
  isTeamMode: boolean;
  canManageTeamEntries: boolean;
  activeCalendarCreatedAtKey: string | null;
  setActiveCalendarCreatedAtKey: (key: string | null | ((prev: string | null) => string | null)) => void;
  setSelectedDay: (day: DayData) => void;
  setIsDaySheetOpen: (open: boolean) => void;
  editingRowKey: string | null;
  setEditingRowKey: (key: string | null) => void;
  editingForm: any;
  setEditingForm: (form: any) => void;
  savingRowKey: string | null;
  deletingRowKey: string | null;
  confirmDeleteRowKey: string | null;
  setConfirmDeleteRowKey: (key: string | null) => void;
  teamDepartments: DepartmentOption[];
  teamProjectsByDepartment: Record<string, ProjectOption[]>;
  teamLoggerProjectsLoading: boolean;
  fetchTeamLoggerProjectsForDepartment: (departmentId: string) => void;
  handleStartEdit: (row: TimesheetRow, index: number) => void;
  handleCancelEdit: () => void;
  handleSaveEdit: (row: TimesheetRow, index: number) => void;
  handleDeleteEntry: (row: TimesheetRow, index: number) => void;
  renderEmptyDayActions: (options: {
    dateApi?: string;
    layout?: "inline" | "stack";
    stopPropagation?: boolean;
    showLabel?: boolean;
  }) => React.ReactNode;
  getProjectPill: (row: TimesheetRow) => { label: string; tone: ProjectPillTone } | null;
  getProjectPillClassName: (tone: ProjectPillTone) => string;
  formatCreatedAt: (value?: string | null) => string;
  dailyTotals: Map<string, number>;
  dateCreatedAtMap: Map<string, string | undefined>;
  getRowKey: (row: TimesheetRow, index: number) => string;
  highlightedDateApi: string | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const DashboardViewSection = ({
  viewMode,
  monthlyData,
  timesheetRows,
  isTeamMode,
  canManageTeamEntries,
  activeCalendarCreatedAtKey,
  setActiveCalendarCreatedAtKey,
  setSelectedDay,
  setIsDaySheetOpen,
  editingRowKey,
  setEditingRowKey,
  editingForm,
  setEditingForm,
  savingRowKey,
  deletingRowKey,
  confirmDeleteRowKey,
  setConfirmDeleteRowKey,
  teamDepartments,
  teamProjectsByDepartment,
  teamLoggerProjectsLoading,
  fetchTeamLoggerProjectsForDepartment,
  handleStartEdit,
  handleCancelEdit,
  handleSaveEdit,
  handleDeleteEntry,
  renderEmptyDayActions,
  getProjectPill,
  getProjectPillClassName,
  formatCreatedAt,
  dailyTotals,
  dateCreatedAtMap,
  getRowKey,
  highlightedDateApi,
  isLoading,
  error,
  onRetry,
}: DashboardViewSectionProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (timesheetRows.length === 0 && viewMode === "table") {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">No records found for this period</p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <CalendarViewComponent
        monthlyData={monthlyData}
        timesheetRows={timesheetRows}
        activeCalendarCreatedAtKey={activeCalendarCreatedAtKey}
        setActiveCalendarCreatedAtKey={setActiveCalendarCreatedAtKey}
        setSelectedDay={setSelectedDay}
        setIsDaySheetOpen={setIsDaySheetOpen}
        renderEmptyDayActions={renderEmptyDayActions}
        getProjectPill={getProjectPill}
        getProjectPillClassName={getProjectPillClassName}
      />
    );
  }

  return (
    <ListViewComponent
      monthlyData={monthlyData}
      timesheetRows={timesheetRows}
      isTeamMode={isTeamMode}
      canManageTeamEntries={canManageTeamEntries}
      editingRowKey={editingRowKey}
      setEditingRowKey={setEditingRowKey}
      editingForm={editingForm}
      setEditingForm={setEditingForm}
      savingRowKey={savingRowKey}
      deletingRowKey={deletingRowKey}
      confirmDeleteRowKey={confirmDeleteRowKey}
      setConfirmDeleteRowKey={setConfirmDeleteRowKey}
      teamDepartments={teamDepartments}
      teamProjectsByDepartment={teamProjectsByDepartment}
      teamLoggerProjectsLoading={teamLoggerProjectsLoading}
      fetchTeamLoggerProjectsForDepartment={fetchTeamLoggerProjectsForDepartment}
      handleStartEdit={handleStartEdit}
      handleCancelEdit={handleCancelEdit}
      handleSaveEdit={handleSaveEdit}
      handleDeleteEntry={handleDeleteEntry}
      renderEmptyDayActions={renderEmptyDayActions}
      getProjectPill={getProjectPill}
      getProjectPillClassName={getProjectPillClassName}
      formatCreatedAt={formatCreatedAt}
      dailyTotals={dailyTotals}
      dateCreatedAtMap={dateCreatedAtMap}
      getRowKey={getRowKey}
      highlightedDateApi={highlightedDateApi}
    />
  );
};
