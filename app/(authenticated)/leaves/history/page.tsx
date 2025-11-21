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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/app/_components/AppHeader";
import { PageWrapper } from "@/app/_components/wrapper";
import { API_PATHS } from "@/lib/constants";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { LeaveTable } from "./_components/LeaveTable";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

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
  const [teamLeaveHistory, setTeamLeaveHistory] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTeamLoading, setIsTeamLoading] = useState(true);
  const [mainTab, setMainTab] = useState<string>("my-leaves");

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

  // Fetch team leave requests from API
  useEffect(() => {
    let isMounted = true;

    async function fetchTeamLeaveRequests() {
      setIsTeamLoading(true);
      try {
        const response = await apiClient.get(API_PATHS.LEAVES_TEAM_REQUESTS);

        const allTeamRequests = Array.isArray(response.data)
          ? response.data
          : [];

        if (isMounted) {
          setTeamLeaveHistory(allTeamRequests);
        }
      } catch (error) {
        console.error("Error fetching team leave requests:", error);
        toast.error("Failed to load team leave requests", {
          description: "Unable to fetch team leave data. Please try again.",
        });
        if (isMounted) {
          setTeamLeaveHistory([]);
        }
      } finally {
        if (isMounted) {
          setIsTeamLoading(false);
        }
      }
    }

    fetchTeamLeaveRequests();
    return () => {
      isMounted = false;
    };
  }, []);

  // Generate month options from both leave history and team leave history data
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    [...leaveHistory, ...teamLeaveHistory].forEach((record) => {
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
  }, [leaveHistory, teamLeaveHistory]);

  // Filter leave records by selected month
  const filteredLeaves = useMemo(() => {
    if (selectedMonth === "all") return leaveHistory;

    return leaveHistory.filter((record) => {
      const recordMonth = format(parseISO(record.startDate), "yyyy-MM");
      return recordMonth === selectedMonth;
    });
  }, [leaveHistory, selectedMonth]);

  // Filter team leave records by selected month
  const filteredTeamLeaves = useMemo(() => {
    if (selectedMonth === "all") return teamLeaveHistory;

    return teamLeaveHistory.filter((record) => {
      const recordMonth = format(parseISO(record.startDate), "yyyy-MM");
      return recordMonth === selectedMonth;
    });
  }, [teamLeaveHistory, selectedMonth]);

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

  // Separate team leaves by state
  const teamPendingLeaves = filteredTeamLeaves.filter(
    (leave) => leave.state === "pending"
  );
  const teamApprovedLeaves = filteredTeamLeaves.filter(
    (leave) => leave.state === "approved"
  );
  const teamRejectedLeaves = filteredTeamLeaves.filter(
    (leave) => leave.state === "rejected"
  );

  return (
    <>
      <AppHeader
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Leave History" }]}
      />
      <PageWrapper>
        <Card className="mx-auto min-w-[120px] sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl overflow-x-hidden">
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
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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
            <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
              <TabsList>
                <TabsTrigger value="my-leaves">My Leaves</TabsTrigger>
                <TabsTrigger value="team-management">
                  Team Management
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-leaves" className="mt-4">
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
                    <LeaveTable leaves={pendingLeaves} isLoading={isLoading} />
                  </TabsContent>
                  <TabsContent value="approved" className="mt-4">
                    <LeaveTable leaves={approvedLeaves} isLoading={isLoading} />
                  </TabsContent>
                  <TabsContent value="rejected" className="mt-4">
                    <LeaveTable leaves={rejectedLeaves} isLoading={isLoading} />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="team-management" className="mt-4">
                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending">
                      Pending ({teamPendingLeaves.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                      Approved ({teamApprovedLeaves.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      Rejected ({teamRejectedLeaves.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="pending" className="mt-4">
                    <DataTable columns={columns} data={teamPendingLeaves} />
                  </TabsContent>
                  <TabsContent value="approved" className="mt-4">
                    <LeaveTable
                      leaves={teamApprovedLeaves}
                      isLoading={isTeamLoading}
                    />
                  </TabsContent>
                  <TabsContent value="rejected" className="mt-4">
                    <LeaveTable
                      leaves={teamRejectedLeaves}
                      isLoading={isTeamLoading}
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </PageWrapper>
    </>
  );
}
