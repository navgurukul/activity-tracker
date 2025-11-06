"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { API_PATHS, DATE_FORMATS, VALIDATION } from "@/lib/constants";
import { mockDataService } from "@/lib/mock-data";

// TypeScript interfaces for API response
interface LeaveTypeResponse {
  id: number;
  code: string;
  name: string;
  paid: boolean;
  requiresApproval: boolean;
  description?: string;
  maxPerRequestHours?: number;
}

const formSchema = z
  .object({
    employeeEmail: z.string().email(),
    leaveType: z.string().min(1, "Please select a leave type."),
    reason: z
      .string()
      .min(
        VALIDATION.MIN_LEAVE_REASON_LENGTH,
        `Please provide at least ${VALIDATION.MIN_LEAVE_REASON_LENGTH} characters for the reason.`
      ),
    startDate: z.date({
      message: "Start date is required.",
    }),
    endDate: z.date({
      message: "End date is required.",
    }),
    durationType: z.string().min(1, "Please select a duration type."),
    halfDaySegment: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      if (data.durationType === "half_day") {
        return data.startDate.getTime() === data.endDate.getTime();
      }
      return true;
    },
    {
      message: "Half-day leave must be for a single day only.",
      path: ["endDate"],
    }
  );

interface LeaveApplicationFormProps {
  userEmail: string;
}

export function LeaveApplicationForm({ userEmail }: LeaveApplicationFormProps) {
  // Get mock data from centralized service (duration types)
  const durationTypes = mockDataService.getDurationTypes();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeResponse[]>([]);
  const [selectedDurationType, setSelectedDurationType] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function fetchLeaveTypes() {
      try {
        const res = await apiClient.get(API_PATHS.LEAVES_TYPES);
        const types = Array.isArray(res.data) ? res.data : [];
        if (isMounted) {
          setLeaveTypes(types);
        }
      } catch (error) {
        console.error("Error fetching leave types:", error);
        // Fallback to empty array if API fails
        setLeaveTypes([]);
      }
    }

    fetchLeaveTypes();
    return () => {
      isMounted = false;
    };
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeEmail: userEmail,
      leaveType: "",
      reason: "",
      startDate: undefined,
      endDate: undefined,
      durationType: "",
      halfDaySegment: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      // Find the selected leave type to get its ID
      const selectedLeaveType = leaveTypes.find(
        (type) => type.code === values.leaveType
      );

      if (!selectedLeaveType) {
        toast.error("Invalid leave type selected");
        setIsSubmitting(false);
        return;
      }

      // Calculate hours based on duration type
      const startDate = new Date(values.startDate);
      const endDate = new Date(values.endDate);
      const daysDifference =
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;

      let hours = 0;
      if (values.durationType === "full_day") {
        hours = daysDifference * 8; // Assuming 8 hours per full day
      } else if (values.durationType === "half_day") {
        hours = 4; // Half day is 4 hours
      }

      // Transform form data to match API payload structure
      const payload: {
        leaveTypeId: number;
        startDate: string;
        endDate: string;
        hours: number;
        reason: string;
        durationType: string;
        halfDaySegment?: string;
      } = {
        leaveTypeId: selectedLeaveType.id,
        startDate: format(values.startDate, DATE_FORMATS.API),
        endDate: format(values.endDate, DATE_FORMATS.API),
        hours: hours,
        reason: values.reason,
        durationType: values.durationType,
      };

      // Add halfDaySegment only if durationType is half_day
      if (values.durationType === "half_day" && values.halfDaySegment) {
        payload.halfDaySegment = values.halfDaySegment;
      }

      const response = await apiClient.post(API_PATHS.LEAVES_REQUESTS, payload);

      if (response.status === 200 || response.status === 201) {
        toast.success("Leave application submitted successfully!", {
          description: "Your leave request has been sent for approval.",
        });

        form.reset();
      }
    } catch (error) {
      console.error("Error submitting leave application:", error);

      const errorMessage =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : error instanceof Error
          ? error.message
          : "Failed to submit leave application. Please try again.";

      toast.error("Submission failed", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto w-full min-w-[120px] max-w-[80vw] sm:max-w-xs md:max-w-lg lg:max-w-2xl xl:max-w-3xl">
      <CardHeader>
        <CardTitle className="text-2xl mb-2">Leave Application</CardTitle>
        <CardDescription className="text-muted-foreground">
          Submit your leave request by filling out the form below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Employee Information Section - Read Only */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="text-lg font-semibold">Employee Information</h3>
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
            </div>

            {/* Leave Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Leave Details</h3>

              <FormField
                control={form.control}
                name="leaveType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leaveTypes.map((type) => (
                          <SelectItem key={type.id} value={type.code}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the type of leave you are applying for
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Leave</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide a reason for your leave request..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed reason for your leave request
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="noShadow"
                              className={cn(
                                "w-full justify-start text-left font-normal",
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
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              // If half-day is selected, automatically update end date
                              if (selectedDurationType === "half_day" && date) {
                                form.setValue("endDate", date);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Select the start date of your leave
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="noShadow"
                              disabled={selectedDurationType === "half_day"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
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
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        {selectedDurationType === "half_day"
                          ? "End date is automatically set to start date for half-day leave"
                          : "Select the end date of your leave"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="durationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedDurationType(value);

                        // When half-day is selected, set end date to match start date
                        if (value === "half_day") {
                          const startDate = form.getValues("startDate");
                          if (startDate) {
                            form.setValue("endDate", startDate);
                          }
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {durationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Specify whether this is a full day or half day leave
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditional Half Day Segment field */}
              {selectedDurationType === "half_day" && (
                <FormField
                  control={form.control}
                  name="halfDaySegment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Half Day Segment</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select half day segment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="first_half">First Half</SelectItem>
                          <SelectItem value="second_half">
                            Second Half
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select which half of the day you'll be taking leave
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Leave Application"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
