"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DATE_FORMATS } from "@/lib/constants";

export type LeaveRequest = {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  managerId: number;
  leaveType: {
    id: number;
    name: string;
    code: string;
  };
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
};

// Helper function to format duration
const formatDuration = (leave: LeaveRequest) => {
  if (leave.durationType === "half_day") {
    const segment =
      leave.halfDaySegment === "first_half" ? "First Half" : "Second Half";
    return `Half Day (${segment})`;
  }
  const days = leave.hours / 8;
  return days === 1 ? "1 Day" : `${days} Days`;
};

export const columns: ColumnDef<LeaveRequest>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "user.name",
    header: "Employee",
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "leaveType.name",
    header: "Leave Type",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.leaveType.name}</div>
    ),
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => {
      return format(parseISO(row.getValue("startDate")), DATE_FORMATS.DISPLAY);
    },
  },
  {
    accessorKey: "endDate",
    header: "End Date",
    cell: ({ row }) => {
      return format(parseISO(row.getValue("endDate")), DATE_FORMATS.DISPLAY);
    },
  },
  {
    accessorKey: "hours",
    header: "Duration",
    cell: ({ row }) => {
      return formatDuration(row.original);
    },
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <div className="max-w-xs truncate">{row.getValue("reason")}</div>
    ),
  },
  {
    accessorKey: "requestedAt",
    header: "Requested At",
    cell: ({ row }) => {
      return format(
        parseISO(row.getValue("requestedAt")),
        DATE_FORMATS.DISPLAY
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const leave = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="noShadow" className="size-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                // TODO: Implement approve logic
                console.log("Approve leave request:", leave.id);
              }}
              className="text-green-600"
            >
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // TODO: Implement reject logic
                console.log("Reject leave request:", leave.id);
              }}
              className="text-red-600"
            >
              Reject
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                // TODO: Implement view details
                console.log("View details:", leave);
              }}
            >
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
