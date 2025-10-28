"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AllocatedLeave {
  leaveType: string;
  allotted: number;
  balance: number;
  booked: number;
  pending: number;
}

interface AllocatedLeavesTableProps {
  leaves: AllocatedLeave[];
}

export function AllocatedLeavesTable({ leaves }: AllocatedLeavesTableProps) {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Leave Type</TableHead>
            <TableHead className="text-center">Allotted</TableHead>
            <TableHead className="text-center">Balance</TableHead>
            <TableHead className="text-center">Booked</TableHead>
            <TableHead className="text-center">Pending</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaves.map((leave) => (
            <TableRow key={leave.leaveType}>
              <TableCell className="font-medium">{leave.leaveType}</TableCell>
              <TableCell className="text-center">{leave.allotted}</TableCell>
              <TableCell className="text-center">{leave.balance}</TableCell>
              <TableCell className="text-center">{leave.booked}</TableCell>
              <TableCell className="text-center">{leave.pending}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
