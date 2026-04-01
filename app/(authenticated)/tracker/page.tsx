"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppHeader } from "@/app/_components/AppHeader";
import { PageWrapper } from "@/app/_components/wrapper";
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
  // Get authenticated user data
  const { user, isLoading, refreshUser } = useAuth();

  // Get mock data from centralized service

  const [departments, setDepartments] = useState<
    { id: number; name: string; code: string; description?: string | null }[]
  >([]);

  const [projectsByDept, setProjectsByDept] = useState<
    Record<string, { id: number; name: string; code: string }[]>
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
      let allProjects: { id: number; name: string; code: string }[] = [];
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">Activity Logger</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Log your daily activities and manage your time effectively.
                  </CardDescription>
                </div>
                <div
                  className={cn(
                    "w-full sm:w-auto min-w-[170px] bg-background border border-border rounded-lg p-3 border-l-4",
                    (user?.backfill?.remaining ?? 0) > 0
                      ? "border-l-[#748074]"
                      : "border-l-amber-400"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Lifelines
                    </span>
                    <span
                      className={cn(
                        "p-1.5 rounded-md",
                        (user?.backfill?.remaining ?? 0) > 0
                          ? "bg-[#e5eeea]"
                          : "bg-amber-50"
                      )}
                    >
                      <AlertCircle
                        className={cn(
                          "h-3.5 w-3.5",
                          (user?.backfill?.remaining ?? 0) > 0
                            ? "text-[#748074]"
                            : "text-amber-600"
                        )}
                      />
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
                    {user?.backfill?.remaining ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {user?.backfill?.limit ?? 0} available
                  </p>
                </div>
              </div>
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
                        <FormItem className="flex flex-col">
                          <FormLabel>Activity Date</FormLabel>
                          <Popover
                            open={calendarOpen}
                            onOpenChange={setCalendarOpen}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="noShadow"
                                  className={cn(
                                    "w-full md:w-[280px] justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, DATE_FORMATS.DISPLAY)
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto border-0! p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  if (!date) return;
                                  field.onChange(date);
                                  setCalendarOpen(false);
                                }}
                                disabled={disableInvalidDates}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            {(user?.backfill?.remaining ?? 0) > 0
                              ? "Select a date for today or within the last three days (depending on available lifelines for logging activities.)"
                              : "Only today's date can be selected for tracking activities. Your backfill limit has been reached."}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Project Entries Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        Project Activities
                      </h3>
                    </div>

                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-4 border-2 border-border rounded-base space-y-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            Project Entry #{index + 1}
                          </h4>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="noShadow"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`projectEntries.${index}.currentWorkingDepartment`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Current Working Department
                                </FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    form.setValue(
                                      `projectEntries.${index}.projectId`,
                                      ""
                                    );
                                    setProjectSearchQuery((prev) => ({
                                      ...prev,
                                      [index]: "",
                                    }));
                                    fetchProjectsForDepartment(value);
                                  }}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {departments.map((dept) => (
                                      <SelectItem
                                        key={dept.id}
                                        value={dept.code}
                                      >
                                        {dept.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`projectEntries.${index}.projectId`}
                            render={({ field }) => {
                              const selectedDeptCode = form.watch(
                                `projectEntries.${index}.currentWorkingDepartment`
                              );
                              const projectOptions =
                                projectsByDept[selectedDeptCode] || [];

                              const searchQuery =
                                projectSearchQuery[index] || "";
                              const filteredProjects = projectOptions.filter(
                                (project) =>
                                  project.name
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase()) ||
                                  project.code
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase())
                              );

                              return (
                                <FormItem>
                                  <FormLabel>Project</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select project" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <div className="px-2 pb-2">
                                        <Input
                                          placeholder="Search projects..."
                                          value={searchQuery}
                                          onChange={(e) => {
                                            setProjectSearchQuery((prev) => ({
                                              ...prev,
                                              [index]: e.target.value,
                                            }));
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="h-8"
                                        />
                                      </div>
                                      {filteredProjects.length === 0 ? (
                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                          No projects found
                                        </div>
                                      ) : (
                                        filteredProjects.map((project) => (
                                          <SelectItem
                                            key={project.id}
                                            value={project.id.toString()}
                                          >
                                            {project.name}
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`projectEntries.${index}.hoursSpent`}
                          render={({ field }) => {
                            const selectedDeptCode = form.watch(
                              `projectEntries.${index}.currentWorkingDepartment`
                            );
                            const selectedProjId = form.watch(
                              `projectEntries.${index}.projectId`
                            );
                            const projectOptionsLocal =
                              projectsByDept[selectedDeptCode] || [];
                            const selectedProject = projectOptionsLocal.find(
                              (p) => p.id.toString() === selectedProjId
                            );
                            const isAdHoc =
                              selectedProject?.name === "Ad-hoc tasks";
                            const perProjectMax = isAdHoc
                              ? 2
                              : VALIDATION.MAX_HOURS_PER_ENTRY;

                            const display = hoursInput[index] ?? (
                              field.value === undefined || field.value === null
                                ? ""
                                : String(field.value)
                            );
                            const maxIntLen = String(perProjectMax).length;
                             return (
                               <FormItem>
                                 <FormLabel>Hours Spent</FormLabel>
                                 <FormControl>
                                   <Input
                                    type="text"
                                    placeholder="0.0"
                                    value={display}
                                    onChange={(e) => {
                                      let v = e.target.value.replace(/[^0-9.]/g, "");
                                      const dot = v.indexOf(".");
                                      if (dot !== -1) {
                                        v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, "");
                                      }
                                      v = v.replace(/^0+(?=\d)/, "");
                                      const parts = v.split(".");
                                      if (parts[0].length > maxIntLen) {
                                        parts[0] = parts[0].slice(0, maxIntLen);
                                        v = parts.join(".");
                                      }
                                      const intVal = parseInt(parts[0] || "0", 10);
                                      if (!Number.isNaN(intVal) && intVal >= perProjectMax) {
                                        v = String(perProjectMax);
                                      } else if (parts[1]) {
                                        v = `${parts[0]}.${parts[1].slice(0, 1)}`;
                                      }
                                      setHoursInput((prev) => ({ ...prev, [index]: v }));
                                    }}
                                    onBlur={() => {
                                      const { num, display } = sanitizeHoursDisplay(hoursInput[index], perProjectMax, isAdHoc);
                                      field.onChange(num);
                                      setHoursInput((prev) => ({ ...prev, [index]: display }));
                                    }}
                                   />
                                 </FormControl>
                                 <FormMessage />
                               </FormItem>
                             );
                           }}
                         />

                        <FormField
                          control={form.control}
                          name={`projectEntries.${index}.taskDescription`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Task Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe your task, achievements, and progress made..."
                                  className="min-h-[100px] resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Provide a detailed description of your work
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Total Hours Validation Error */}
                  {form.formState.errors.projectEntries?.root && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Validation Error</AlertTitle>
                      <AlertDescription>
                        {form.formState.errors.projectEntries.root.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* <div className="flex flex-col gap-3 pb-4"> */}
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={addProjectEntry}
                    className="self-start"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Project Activity
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Activity Logger"}
                  </Button>
                  {/* </div> */}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}
