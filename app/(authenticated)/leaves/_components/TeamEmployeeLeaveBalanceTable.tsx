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

interface TeamEmployeeLeaveBalanceTableProps {
  sortedTeamEmployeeBalances: LeaveBalanceItem[];
  editingAllocatedBalance: LeaveBalanceItem | null;
  editingAllocatedHours: string;
  isUpdatingAllocated: boolean;
  canEditTeamPendingRequests: boolean;
  setEditingAllocatedHours: (value: string) => void;
  setEditingAllocatedBalance: (value: LeaveBalanceItem | null) => void;
  handleUpdateAllocatedBalance: () => Promise<void>;
}

export function TeamEmployeeLeaveBalanceTable({
  sortedTeamEmployeeBalances,
  editingAllocatedBalance,
  editingAllocatedHours,
  isUpdatingAllocated,
  canEditTeamPendingRequests,
  setEditingAllocatedHours,
  setEditingAllocatedBalance,
  handleUpdateAllocatedBalance,
}: TeamEmployeeLeaveBalanceTableProps) {
  return (
    <div className="mt-3 overflow-x-auto rounded-md border border-border">
      <Table className="w-full text-sm min-w-[640px]">
        <TableHeader>
          <TableRow className="border-b border-border bg-secondary-background">
            <TableHead className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Leave Type
            </TableHead>
            <TableHead className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Allocated
            </TableHead>
            <TableHead className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available
            </TableHead>
            <TableHead className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending
            </TableHead>
            <TableHead className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Approved
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTeamEmployeeBalances.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="px-4 py-6 text-center text-sm text-muted-foreground"
              >
                No leave balance found for this employee.
              </TableCell>
            </TableRow>
          ) : (
            sortedTeamEmployeeBalances.map((balance) => (
              <TableRow
                key={balance.id}
                className="border-b border-border last:border-0"
              >
                <TableCell className="px-4 py-3 font-medium text-foreground">
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
                <TableCell className="px-4 py-3 text-center tabular-nums">
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
                      <span>{formatLeaveDaysValue(balance.allocatedHours / 8)}</span>
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
                <TableCell className="px-4 py-3 text-center tabular-nums">
                  {formatLeaveDaysValue(balance.balanceHours / 8)}
                </TableCell>
                <TableCell className="px-4 py-3 text-center tabular-nums">
                  {formatLeaveDaysValue(balance.pendingHours / 8)}
                </TableCell>
                <TableCell className="px-4 py-3 text-center tabular-nums">
                  {formatLeaveDaysValue(balance.bookedHours / 8)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
