"use client";

import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import {
  Check,
  X,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TimesheetEntry,
  LeaveEntry,
  DayData,
  MonthlyTimesheetResponse,
  TimesheetRow,
  ProjectPillTone,
  ProjectOption,
  DepartmentOption,
} from "@/lib/dashboard-type";

interface ListViewComponentProps {
  monthlyData: MonthlyTimesheetResponse | null;
  timesheetRows: TimesheetRow[];
  isTeamMode: boolean;
  canManageTeamEntries: boolean;
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
}

export const ListViewComponent: React.FC<ListViewComponentProps> = ({
  monthlyData,
  timesheetRows,
  isTeamMode,
  canManageTeamEntries,
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
}) => {
  return (
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

              let rowBgClass = "timesheet-row-bg-default";
              let isColored = false;

              if (
                (row.isLeave && row.leaveStatus === "rejected") ||
                row.timesheetState === "rejected"
              ) {
                  if (row.timesheetState === "rejected") {
                    rowBgClass = "timesheet-row-bg-rejected";
                    isColored = true;
                  }
                } else if (
                row.isLeave &&
                row.leaveStatus === "pending"
                ) {
                } else if (row.isHoliday) {
                rowBgClass = "timesheet-row-bg-holiday";
                isColored = true;
              } else if (row.isWeekend) {
                rowBgClass = "timesheet-row-bg-weekend";
                isColored = true;
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
                    rowBgClass,
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
                          setEditingForm((prev: any) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                        className="h-8 w-36"
                      />
                    ) : !isSameDateAsPrev ? (
                      <span>{row.date}</span>
                    ) : (
                      ""
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-sm text-foreground whitespace-nowrap">
                    {!isSameDateAsPrev ? row.day : ""}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-3 py-2.5 text-sm text-center whitespace-nowrap",
                      row.isLeave ? "font-normal" : "font-semibold"
                    )}
                  >
                    {!isSameDateAsPrev ? (
                      <span
                        style={{
                          color: "var(--foreground)",
                        }}
                      >
                        {(() => {
                          const dayTotal = dailyTotals.get(row.date) ?? 0;
                          if (dayTotal > 0) return `${dayTotal}h`;
                          if (row.isLeave && row.hoursDisplay) return row.hoursDisplay;
                          return "0h";
                        })()}
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
                            setEditingForm((prev: any) => ({
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
                                setEditingForm((prev: any) => ({
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
                          setEditingForm((prev: any) => ({
                            ...prev,
                            hours: val,
                          }));
                        }}
                        className="h-8 w-16 text-center"
                      />
                    ) : (
                      row.isLeave
                        ? "-"
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
                          setEditingForm((prev: any) => ({
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
                              <span className="text-xs text-muted-foreground whitespace-nowrap">Are you sure?</span>
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

          let cardBgClass = "timesheet-row-bg-default";
          const projectPill = getProjectPill(row);

          if (
            (row.isLeave && row.leaveStatus === "rejected") ||
            row.timesheetState === "rejected"
          ) {
              if (row.timesheetState === "rejected") {
                cardBgClass = "timesheet-row-bg-rejected";
              }
            } else if (
            row.isLeave &&
            row.leaveStatus === "pending"
            ) {
            } else if (
            row.isHoliday ||
              row.isWeekend
          ) {
            cardBgClass = "timesheet-row-bg-non-working";
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
                cardBgClass,
                highlightedDateApi !== null &&
                row.dateApi === highlightedDateApi &&
                "animate-[pulse_1s_ease-in-out_3]"
              )}
              style={{
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
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-foreground">
                    {row.isLeave
                      ? "-"
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
  );
};
