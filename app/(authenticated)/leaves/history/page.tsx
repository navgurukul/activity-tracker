"use client";

import { AppHeader } from "@/app/_components/AppHeader";
import { PageWrapper } from "@/app/_components/wrapper";
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockDataService, LeaveHistoryRecord } from "@/lib/mock-data";
import { format, parseISO } from "date-fns";
import { DATE_FORMATS } from "@/lib/constants";

export default function LeaveHistoryPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const leaveHistory = mockDataService.getLeaveHistory();

  // Generate month options from leave history data
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    leaveHistory.forEach((record) => {
      const date = parseISO(record.startDate);
      const monthYear = format(date, "yyyy-MM");
      months.add(monthYear);
    });
    return Array.from(months)
      .sort()
      .reverse()
      .map((monthYear) => ({
        value: monthYear,
        label: format(parseISO(`${monthYear}-01`), "MMMM yyyy"),
      }));
  }, [leaveHistory]);

  // Filter leave records by selected month
  const filteredLeaves = useMemo(() => {
    if (selectedMonth === "all") return leaveHistory;

    return leaveHistory.filter((record) => {
      const recordMonth = format(parseISO(record.startDate), "yyyy-MM");
      return recordMonth === selectedMonth;
    });
  }, [leaveHistory, selectedMonth]);

  // Separate leaves by status
  const pendingLeaves = filteredLeaves.filter(
    (leave) => leave.status === "pending"
  );
  const approvedLeaves = filteredLeaves.filter(
    (leave) => leave.status === "approved"
  );
  const rejectedLeaves = filteredLeaves.filter(
    (leave) => leave.status === "rejected"
  );

  // Table component for displaying leave records
  const LeaveTable = ({ leaves }: { leaves: LeaveHistoryRecord[] }) => {
    if (leaves.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No leave records found for the selected period.
        </div>
      );
    }

    return (
      // <div className="rounded-base border-2 border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Leave Type</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaves.map((leave) => (
            <TableRow key={leave.id}>
              <TableCell className="font-medium">{leave.leaveType}</TableCell>
              <TableCell>
                {format(parseISO(leave.startDate), DATE_FORMATS.DISPLAY)}
              </TableCell>
              <TableCell>
                {format(parseISO(leave.endDate), DATE_FORMATS.DISPLAY)}
              </TableCell>
              <TableCell>{leave.duration}</TableCell>
              <TableCell className="max-w-xs truncate">
                {leave.reason}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <>
      <AppHeader
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Leave History" }]}
      />
      <PageWrapper>
        <div className="flex w-full justify-center p-4">
          <Card className="mx-auto w-full min-w-[120px] max-w-[80vw] sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl mb-2">Leave History</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    View and manage your historical leave requests and their
                    status.
                  </p>
                </div>
                <div className="w-full sm:w-[200px]">
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {monthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending">
                    Pending ({pendingLeaves.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    Approved ({approvedLeaves.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Rejected ({rejectedLeaves.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                  <LeaveTable leaves={pendingLeaves} />
                </TabsContent>
                <TabsContent value="approved" className="mt-4">
                  <LeaveTable leaves={approvedLeaves} />
                </TabsContent>
                <TabsContent value="rejected" className="mt-4">
                  <LeaveTable leaves={rejectedLeaves} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}
