"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { format } from "date-fns";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import {
  Form,
  FormField,
} from "@/components/ui/form";
import { AppHeader } from "@/app/_components/AppHeader";
import { PageWrapper } from "@/app/_components/wrapper";
import {
  ActivityDatePicker,
  FormHeader,
  ProjectActivitiesSection,
} from "./_components";
import apiClient from "@/lib/api-client";
import {
  API_PATHS,
  DATE_FORMATS,
  TRACKER_BACKFILL_VALIDATION_MESSAGE,
  VALIDATION,
  WORK_DAYS_NEEDED,
} from "@/lib/constants";
import { cn, getISTBusinessDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  checkTimesheetConflictWithLeave,
  invalidateMonthlyTimesheetCache,
  isNonWorkingDay,
} from "@/lib/leave-timesheet-validator";

export default function TrackerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Get authenticated user data
  const { user, isLoading, refreshUser } = useAuth();

  // Get mock data from centralized service

  const [departments, setDepartments] = useState<
    { id: number; name: string; code: string; description?: string | null }[]
  >([]);

  const [projectsByDept, setProjectsByDept] = useState<
    Record<string, { id: number; name: string; code: string; status?: string }[]>
  >({});

  const [projectSearchQuery, setProjectSearchQuery] = useState<
    Record<number, string>
  >({});

  useEffect(() => {
    if (isLoading) return;
    const orgId = user?.orgId;
    if (!orgId) return;

    const fetchDepartments = async () => {
      try {
        const res = await apiClient.get(API_PATHS.DEPARTMENTS, {
          params: { orgId },
        });
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setDepartments(list);
      } catch (error: any) {
        console.error("Failed to load departments:", error);
        toast.error("Failed to load departments", {
          description:
            error.response?.data?.message ||
            error.message ||
            "Please try again.",
        });
      }
    };

    fetchDepartments();
  }, [isLoading, user?.orgId]);

  const disableInvalidDates = (date: Date) => {
    const istToday = getISTBusinessDate();
    const cutoffDay = 26;

    // Convert input date to IST 00:00:00
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    // Use getISTBusinessDate for IST time
    const istNow = getISTBusinessDate();
    const isAfterCutoff =
      (istNow.getDate() > cutoffDay) ||
      (istNow.getDate() === cutoffDay && istNow.getHours() >= 7);
    if (isAfterCutoff) {
      const cycleStart = new Date(istNow.getFullYear(), istNow.getMonth(), cutoffDay);
      cycleStart.setHours(0, 0, 0, 0);
      if (d < cycleStart) return true;
    }

    if (d.getTime() > istToday.getTime()) return true;

    const backfillRemaining = user?.backfill?.remaining ?? 0;
    if (backfillRemaining === 0) {
      return d.getTime() !== istToday.getTime();
    }

    const workDaysNeeded = WORK_DAYS_NEEDED;
    const cursor = new Date(istToday);
    cursor.setDate(cursor.getDate() - 1);

    let found = 0;
    while (found < workDaysNeeded) {
      if (!isNonWorkingDay(cursor)) {
        found++;
      }
      if (found < workDaysNeeded) {
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    const earliestAllowed = new Date(cursor);
    earliestAllowed.setHours(0, 0, 0, 0);

    if (d.getTime() < earliestAllowed.getTime()) return true;

    return false;
  };

  const fetchProjectsForDepartment = async (deptCode: string) => {
    if (isLoading) return;
    const orgId = user?.orgId;
    if (!orgId || !deptCode) return;
    if (projectsByDept[deptCode]?.length) return;

    const dept = departments.find((d) => d.code === deptCode);
    if (!dept?.id) return;

    try {
      let allProjects: {
        id: number;
        name: string;
        code: string;
        status?: string;
      }[] = [];
      let page = 1;
      let hasMore = true;

      // Fetch all pages
      while (hasMore) {
        const res = await apiClient.get(API_PATHS.PROJECTS, {
          params: { orgId, departmentId: dept.id, page, limit: 100 },
        });

        const responseData = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];
        const projects = Array.isArray(responseData)
          ? responseData
          : responseData.data || [];

        allProjects = [...allProjects, ...projects];
        const total = res.data?.total || projects.length;
        const limit = res.data?.limit || 100;
        hasMore = allProjects.length < total;
        page++;
      }

      setProjectsByDept((prev) => ({ ...prev, [deptCode]: allProjects }));
    } catch (error: any) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects", {
        description:
          error.response?.data?.message || error.message || "Please try again.",
      });
    }
  };

  const formSchema = z.object({
    activityDate: z
      .date()
      .refine(
        (date) => {
          const istToday = getISTBusinessDate();
          // Check if date is in the future (relative to IST business date)
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          if (d.getTime() > istToday.getTime()) return false;
          return true;
        },
        {
          message: "Future dates are not allowed.",
        }
      )
      .refine(
        (date) => {
          const istToday = getISTBusinessDate();
          const selectedDate = new Date(date);
          selectedDate.setHours(0, 0, 0, 0);

          // If backfill remaining is zero, only allow IST business date
          const backfillRemaining = user?.backfill?.remaining ?? 0;
          if (backfillRemaining === 0) {
            return selectedDate.getTime() === istToday.getTime();
          }

          // Find past 3 working days (excluding today)
          const workDaysNeeded = WORK_DAYS_NEEDED;
          const cursor = new Date(istToday);
          cursor.setDate(cursor.getDate() - 1);

          let found = 0;
          while (found < workDaysNeeded) {
            if (!isNonWorkingDay(cursor)) {
              found++;
            }
            if (found < workDaysNeeded) {
              cursor.setDate(cursor.getDate() - 1);
            }
          }

          const earliestAllowed = new Date(cursor);
          earliestAllowed.setHours(0, 0, 0, 0);

          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          const dayBeforeToday = new Date(istToday);
          dayBeforeToday.setDate(dayBeforeToday.getDate() - 1);
          const isISTToday = d.getTime() === istToday.getTime();

          if (isISTToday) return true;
          return (
            d.getTime() >= earliestAllowed.getTime() &&
            d.getTime() <= dayBeforeToday.getTime()
          );
        },
        {
          message: TRACKER_BACKFILL_VALIDATION_MESSAGE,
        }
      ),
    projectEntries: z
      .array(
        z.object({
          currentWorkingDepartment: z
            .string()
            .min(1, "Please select a working department."),
          hoursSpent: z
            .number()
            .min(
              VALIDATION.MIN_HOURS_PER_ENTRY,
              `Minimum ${VALIDATION.MIN_HOURS_PER_ENTRY} hours required.`
            )
            .max(
              VALIDATION.MAX_HOURS_PER_ENTRY,
              `Maximum ${VALIDATION.MAX_HOURS_PER_ENTRY} hours allowed per entry.`
            ),
          projectId: z.string().min(1, "Please select a project."),
          taskDescription: z
            .string()
            .min(
              VALIDATION.MIN_TASK_DESCRIPTION_LENGTH,
              `Please provide at least ${VALIDATION.MIN_TASK_DESCRIPTION_LENGTH} characters describing your task.`
            ),
        })
      )
      .min(1, "At least one project entry is required.")
      .refine(
        (entries) => {
          const totalHours = entries.reduce(
            (sum, entry) => sum + entry.hoursSpent,
            0
          );
          return totalHours <= VALIDATION.MAX_TOTAL_HOURS_PER_DAY;
        },
        {
          message: `Total hours per day cannot exceed ${VALIDATION.MAX_TOTAL_HOURS_PER_DAY} hours across all project entries.`,
        }
      ),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activityDate: getISTBusinessDate(),
      projectEntries: [
        {
          currentWorkingDepartment: "",
          hoursSpent: 0,
          projectId: "",
          taskDescription: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "projectEntries",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [hoursInput, setHoursInput] = useState<Record<number, string>>({});

  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (!dateParam) return;

    const parsed = new Date(`${dateParam}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return;

    form.setValue("activityDate", parsed, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [form, searchParams]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      // Calculate total hours
      const totalHours = values.projectEntries.reduce(
        (sum, entry) => sum + entry.hoursSpent,
        0
      );

      // Check for conflicts with existing leaves
      const conflictResult = await checkTimesheetConflictWithLeave(
        values.activityDate,
        totalHours
      );

      if (conflictResult.hasConflict) {
        toast.error("Conflict with leave application", {
          description: conflictResult.message,
        });
        setIsSubmitting(false);
        return;
      }

      // Transform form data to match API schema
      const payload = {
        workDate: format(values.activityDate, DATE_FORMATS.API),
        notes: "",
        entries: values.projectEntries.map((entry) => ({
          projectId: parseInt(entry.projectId, 10),
          taskDescription: entry.taskDescription,
          hours: entry.hoursSpent,
        })),
      };

      // Validate that all required fields are properly mapped
      const isValid = payload.entries.every(
        (entry) =>
          typeof entry.projectId === "number" &&
          entry.taskDescription &&
          typeof entry.hours === "number"
      );

      if (!isValid) {
        toast.error("Validation failed", {
          description: "Please ensure all required fields are properly filled.",
        });
        setIsSubmitting(false);
        return;
      }

      // Send to backend API
      const response = await apiClient.post(
        API_PATHS.ACTIVITIES_SUBMIT,
        payload
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Activity tracker submitted successfully!", {
          description: "Your activities have been recorded.",
        });

        // Invalidate cache for the submitted month
        const activityMonth = values.activityDate.getMonth() + 1;
        const activityYear = values.activityDate.getFullYear();
        invalidateMonthlyTimesheetCache(activityYear, activityMonth);

        // Refresh user data to update backfill count
        await refreshUser();

        // Reset form to default values
        form.reset({
          activityDate: getISTBusinessDate(),
          projectEntries: [
            {
              currentWorkingDepartment: "",
              hoursSpent: 0,
              projectId: "",
              taskDescription: "",
            },
          ],
        });
        // Redirect to dashboard with date parameter (ISO) so dashboard can open & scroll to the exact day
        const dateParam = format(values.activityDate, "yyyy-MM-dd");
        router.push(`/?date=${dateParam}`);
      }
    } catch (error: any) {
      console.error("Error submitting activity tracker:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to submit activity tracker. Please try again.";

      toast.error("Submission failed", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function addProjectEntry() {
    const lastIndex = fields.length - 1;
    const lastEntry = form.getValues(`projectEntries.${lastIndex}`);
    const isLastEntryComplete =
      lastEntry.currentWorkingDepartment &&
      lastEntry.projectId &&
      lastEntry.hoursSpent > 0 &&
      lastEntry.taskDescription.trim().length >=
        VALIDATION.MIN_TASK_DESCRIPTION_LENGTH;

    if (!isLastEntryComplete) {
      toast.error("Incomplete Entry", {
        description:
          "Please complete the current project entry before adding a new one.",
      });
      return;
    }

    const inheritedDept = lastEntry.currentWorkingDepartment || "";
    if (inheritedDept) fetchProjectsForDepartment(inheritedDept);

    append({
      currentWorkingDepartment: inheritedDept,
      hoursSpent: 0,
      projectId: "",
      taskDescription: "",
    });
  }

  function sanitizeHoursDisplay(raw: string, perProjectMax: number, isAdHoc: boolean) {
    const clean = (raw ?? "").replace(/[^\d.]/g, "");
    const [i = "0", f] = clean.split(".");
    const intPart = i.replace(/^0+(?=\d)/, "") || "0";
    const frac = f ? f.slice(0, 1) : undefined;
    const norm = frac !== undefined ? `${intPart}.${frac}` : intPart;
    let num = norm === "" ? 0 : parseFloat(norm);
    if (!Number.isFinite(num)) num = 0;
    num = Math.round(num * 10) / 10;
    if (isAdHoc && num > 2) num = 2;
    if (num > VALIDATION.MAX_HOURS_PER_ENTRY) num = VALIDATION.MAX_HOURS_PER_ENTRY;
    return { num, display: num === 0 ? "" : String(num) };
  }

  return (
    <>
      <AppHeader crumbs={[{ label: "Activity Logger" }]} />
      <PageWrapper>
        <div className="flex w-full justify-center p-4">
          <Card className="mx-auto w-full min-w-[120px] max-w-[80vw] sm:max-w-xs md:max-w-lg lg:max-w-2xl xl:max-w-3xl">
            <CardHeader>
              <FormHeader backfillRemaining={user?.backfill?.remaining ?? 0} />
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Activity Date Section */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="activityDate"
                      render={({ field }) => (
                        <ActivityDatePicker
                          field={field}
                          disableInvalidDates={disableInvalidDates}
                          backfillRemaining={user?.backfill?.remaining ?? 0}
                        />
                      )}
                    />
                  </div>

                  {/* Project Entries Section */}
                  <ProjectActivitiesSection
                    fields={fields}
                    departments={departments}
                    projectsByDept={projectsByDept}
                    projectSearchQuery={projectSearchQuery}
                    hoursInput={hoursInput}
                    errors={form.formState.errors}
                    control={form.control}
                    remove={remove}
                    watch={form.watch}
                    setValue={form.setValue}
                    setProjectSearchQuery={setProjectSearchQuery}
                    setHoursInput={setHoursInput}
                    onAddEntry={addProjectEntry}
                    onSubmit={form.handleSubmit(onSubmit)}
                    isSubmitting={isSubmitting}
                    fetchProjectsForDepartment={fetchProjectsForDepartment}
                    sanitizeHoursDisplay={sanitizeHoursDisplay}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}
