"use client";

import { useState, useMemo, useEffect } from "react";

import { format, parseISO } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/app/_components/AppHeader";
import { PageWrapper } from "@/app/_components/wrapper";
import { DATE_FORMATS, API_PATHS } from "@/lib/constants";
import apiClient from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// TypeScript interfaces for API response
interface LeaveRequest {
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
}

export default function LeaveHistoryPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leave requests from API (single call, all states mixed)
  useEffect(() => {
    let isMounted = true;

    async function fetchLeaveRequests() {
      setIsLoading(true);
      try {
        // Fetch all leave requests in a single call
        const response = await apiClient.get(API_PATHS.LEAVES_REQUESTS);

        const allRequests = Array.isArray(response.data) ? response.data : [];

        if (isMounted) {
          setLeaveHistory(allRequests);
        }
      } catch (error) {
        console.error("Error fetching leave requests:", error);
        toast.error("Failed to load leave history", {
          description: "Unable to fetch leave requests. Please try again.",
        });
        if (isMounted) {
          setLeaveHistory([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchLeaveRequests();
    return () => {
      isMounted = false;
    };
  }, []);

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

  // Separate leaves by state (client-side split)
  const pendingLeaves = filteredLeaves.filter(
    (leave) => leave.state === "pending"
  );
  const approvedLeaves = filteredLeaves.filter(
    (leave) => leave.state === "approved"
  );
  const rejectedLeaves = filteredLeaves.filter(
    (leave) => leave.state === "rejected"
  );

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

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );

  // Table component for displaying leave records
  const LeaveTable = ({ leaves }: { leaves: LeaveRequest[] }) => {
    if (isLoading) {
      return <LoadingSkeleton />;
    }

    if (leaves.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No leave records found for the selected period.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Leave Type</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Requested At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaves.map((leave) => (
            <TableRow key={leave.id}>
              <TableCell className="font-medium">
                {leave.leaveType.name}
              </TableCell>
              <TableCell>
                {format(parseISO(leave.startDate), DATE_FORMATS.DISPLAY)}
              </TableCell>
              <TableCell>
                {format(parseISO(leave.endDate), DATE_FORMATS.DISPLAY)}
              </TableCell>
              <TableCell>{formatDuration(leave)}</TableCell>
              <TableCell className="max-w-xs truncate">
                {leave.reason}
              </TableCell>
              <TableCell>
                {format(parseISO(leave.requestedAt), DATE_FORMATS.DISPLAY)}
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
