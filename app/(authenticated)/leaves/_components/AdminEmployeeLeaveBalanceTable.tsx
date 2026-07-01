"use client";

import { CheckCircle2, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaveBalanceItem } from "@/lib/leave-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  formatLeaveDaysValue,
  getDisplayLeaveTypeName,
  getLeaveCategory,
  isCompOffLeaveType,
} from "@/lib/leave-helpers";

interface AdminEmployeeLeaveBalanceTableProps {
  sortedAdminEmployeeBalances: LeaveBalanceItem[];
  editingAllocatedBalance: LeaveBalanceItem | null;
  editingAllocatedHours: string;
  isUpdatingAllocated: boolean;
  canEditTeamPendingRequests: boolean;
  setEditingAllocatedHours: (value: string) => void;
  setEditingAllocatedBalance: (value: LeaveBalanceItem | null) => void;
  handleUpdateAllocatedBalance: () => Promise<void>;
}

export function AdminEmployeeLeaveBalanceTable({
  sortedAdminEmployeeBalances,
  editingAllocatedBalance,
  editingAllocatedHours,
  isUpdatingAllocated,
  canEditTeamPendingRequests,
  setEditingAllocatedHours,
  setEditingAllocatedBalance,
  handleUpdateAllocatedBalance,
}: AdminEmployeeLeaveBalanceTableProps) {
  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-secondary-background">
        <span className="text-sm font-medium text-foreground">Leave Balance</span>
      </div>
      <div className="overflow-x-auto">
        <Table className="w-full min-w-[420px] text-sm">
          <TableHeader>
            <TableRow className="border-b border-border bg-secondary-background">
              <TableHead className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Leave Type
              </TableHead>
              <TableHead className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Allocated
              </TableHead>
              <TableHead className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pending
              </TableHead>
              <TableHead className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Taken
              </TableHead>
              <TableHead className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Remaining
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAdminEmployeeBalances.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="px-3 py-4 text-center text-sm text-muted-foreground"
                >
                  No leave balance found for this employee.
                </TableCell>
              </TableRow>
            ) : (
              sortedAdminEmployeeBalances.map((balance) => {
                const allocated = balance.allocatedHours / 8;
                const pending = balance.pendingHours / 8;
                const taken = balance.bookedHours / 8;
                const remaining = balance.balanceHours / 8;
                const remainingTone =
                  remaining <= 0
                    ? "text-red-600"
                    : remaining <= 2
                      ? "text-amber-600"
                      : "text-emerald-600";

                return (
                  <TableRow
                    key={balance.id}
                    className="border-b border-border last:border-0"
                  >
                    <TableCell className="px-3 py-2.5 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{getDisplayLeaveTypeName(balance.leaveType.name)}</span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            getLeaveCategory(balance.leaveType.code, balance.leaveType.name).className
                          )}
                        >
                          {getLeaveCategory(balance.leaveType.code, balance.leaveType.name).label}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-center tabular-nums">
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
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleUpdateAllocatedBalance();
                            }}
                            disabled={isUpdatingAllocated}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                            title="Confirm"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
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
                          <span>{formatLeaveDaysValue(allocated)}</span>
                          {canEditTeamPendingRequests &&
                            !isCompOffLeaveType(balance.leaveType) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingAllocatedBalance(balance);
                                  setEditingAllocatedHours(
                                    String(balance.allocatedHours / 8)
                                  );
                                }}
                                className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                                title="Edit allocated balance"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-center tabular-nums">
                      {formatLeaveDaysValue(pending)}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-center tabular-nums">
                      {formatLeaveDaysValue(taken)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "px-3 py-2.5 text-center tabular-nums font-semibold",
                        remainingTone
                      )}
                    >
                      {formatLeaveDaysValue(remaining)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
