"use client";

import { useState } from "react";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
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
import { AppHeader } from "@/app/_components/AppHeader";
import { PageWrapper } from "@/app/_components/wrapper";
import apiClient from "@/lib/api-client";
import { API_PATHS, DATE_FORMATS, VALIDATION } from "@/lib/constants";
import { mockDataService } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export default function TrackerPage() {
  // Get authenticated user data
  const { user } = useAuth();

  // Get mock data from centralized service
  const workingDepartments = mockDataService.getWorkingDepartments();
  const projects = mockDataService.getProjects();

  const formSchema = z.object({
    employeeEmail: z.string().email(),
    employeeName: z.string().min(1),
    employeeDepartment: z.string().min(1),
    activityDate: z.date(),
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
          taskTitle: z
            .string()
            .min(1, "Task title is required.")
            .max(
              VALIDATION.MAX_TASK_TITLE_LENGTH,
              `Task title cannot exceed ${VALIDATION.MAX_TASK_TITLE_LENGTH} characters.`
            ),
          taskDescription: z
            .string()
            .min(
              VALIDATION.MIN_TASK_DESCRIPTION_LENGTH,
              `Please provide at least ${VALIDATION.MIN_TASK_DESCRIPTION_LENGTH} characters describing your task.`
            ),
          tags: z.array(z.string()),
        })
      )
      .min(1, "At least one project entry is required."),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeEmail: user?.email || "",
      employeeName: user?.name || "",
      employeeDepartment: user?.department?.name || "",
      activityDate: new Date(),
      projectEntries: [
        {
          currentWorkingDepartment: "",
          hoursSpent: 0,
          projectId: "",
          taskTitle: "",
          taskDescription: "",
          tags: [],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "projectEntries",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      // Transform form data to match API schema
      const payload = {
        entries: values.projectEntries.map((entry, index) => ({
          id: 0, // Backend will generate the actual ID
          projectId: parseInt(entry.projectId, 10),
          taskTitle: entry.taskTitle,
          taskDescription: entry.taskDescription,
          hours: entry.hoursSpent,
          tags:
            entry.tags.length > 0
              ? entry.tags
              : [entry.currentWorkingDepartment],
        })),
      };

      // Validate that all required fields are properly mapped
      const isValid = payload.entries.every(
        (entry) =>
          typeof entry.projectId === "number" &&
          entry.taskTitle &&
          entry.taskDescription &&
          typeof entry.hours === "number" &&
          Array.isArray(entry.tags)
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

        // Reset form to default values
        form.reset();
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
    append({
      currentWorkingDepartment: "",
      hoursSpent: 0,
      projectId: "",
      taskTitle: "",
      taskDescription: "",
      tags: [],
    });
  }
  return (
    <>
      <AppHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Activity Tracker" },
        ]}
      />
      <PageWrapper>
        <div className="flex w-full justify-center p-4">
          <Card className="mx-auto w-full min-w-[120px] max-w-[80vw] sm:max-w-xs md:max-w-lg lg:max-w-2xl xl:max-w-3xl">
            <CardHeader>
              <CardTitle className="text-2xl mb-2">Activity Tracker</CardTitle>
              <CardDescription className="text-muted-foreground">
                Track your daily activities and manage your time effectively.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Employee Information Section - Read Only */}
                  <div className="space-y-4 pb-4 border-b">
                    <h3 className="text-lg font-semibold">
                      Employee Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="employeeEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee Email</FormLabel>
                            <FormControl>
                              <Input {...field} disabled className="bg-muted" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="employeeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee Name</FormLabel>
                            <FormControl>
                              <Input {...field} disabled className="bg-muted" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="employeeDepartment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee Department</FormLabel>
                            <FormControl>
                              <Input {...field} disabled className="bg-muted" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Activity Date Section */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="activityDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Activity Date</FormLabel>
                          <Popover>
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
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Select the date for which you are tracking
                            activities.
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
                      <Button
                        type="button"
                        variant="noShadow"
                        size="sm"
                        onClick={addProjectEntry}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Project Entry
                      </Button>
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
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {workingDepartments.map((dept) => (
                                      <SelectItem
                                        key={dept.value}
                                        value={dept.value}
                                      >
                                        {dept.label}
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
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Project</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {projects.map((project) => (
                                      <SelectItem
                                        key={project.value}
                                        value={project.value}
                                      >
                                        {project.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`projectEntries.${index}.hoursSpent`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hours Spent</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step={VALIDATION.HOURS_INPUT_STEP}
                                  min="0"
                                  max={VALIDATION.MAX_HOURS_PER_ENTRY}
                                  placeholder="0.0"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                />
                              </FormControl>
                              {/* <FormDescription>
                                  Maximum 15 hours per entry
                                </FormDescription> */}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`projectEntries.${index}.taskTitle`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Task Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter task title"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Provide a concise title for your task
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
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

                        <FormField
                          control={form.control}
                          name={`projectEntries.${index}.tags`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tags (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter tags separated by commas (e.g., frontend, bug-fix)"
                                  value={field.value?.join(", ") || ""}
                                  onChange={(e) => {
                                    const tags = e.target.value
                                      .split(",")
                                      .map((tag) => tag.trim())
                                      .filter((tag) => tag.length > 0);
                                    field.onChange(tags);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Add tags to categorize your task
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                      {isSubmitting
                        ? "Submitting..."
                        : "Submit Activity Tracker"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}
