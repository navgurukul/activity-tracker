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

const formSchema = z
  .object({
    employeeEmail: z.string().email("Please select a valid employee email."),
    reasonForWorking: z
      .string()
      .min(
        VALIDATION.MIN_LEAVE_REASON_LENGTH,
        `Please provide at least ${VALIDATION.MIN_LEAVE_REASON_LENGTH} characters for the reason.`
      ),
    fromDate: z.date({
      message: "From date is required.",
    }),
    toDate: z.date({
      message: "To date is required.",
    }),
    durationType: z.string().min(1, "Please select a duration type."),
  })
  .refine((data) => data.toDate >= data.fromDate, {
    message: "To date must be on or after the from date.",
    path: ["toDate"],
  });

export function CompOffRequestForm() {
  const [employeeEmails, setEmployeeEmails] = useState<string[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const durationTypes = mockDataService.getDurationTypes();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeEmail: "",
      reasonForWorking: "",
      fromDate: undefined,
      toDate: undefined,
      durationType: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch employee emails from API
  useEffect(() => {
    async function fetchEmployeeEmails() {
      setIsLoadingEmails(true);
      try {
        // Replace with actual API endpoint when available
        const response = await apiClient.get(API_PATHS.EMPLOYEES);

        if (response.data && Array.isArray(response.data)) {
          const emails = response.data.map((emp: any) => emp.email);
          setEmployeeEmails(emails);
        }
      } catch (error: any) {
        console.error("Error fetching employee emails:", error);

        // Fallback to mock data if API fails
        const mockUser = mockDataService.getCurrentUser();
        setEmployeeEmails([mockUser.email]);
      } finally {
        setIsLoadingEmails(false);
      }
    }

    fetchEmployeeEmails();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      const payload = {
        employeeEmail: values.employeeEmail,
        reasonForWorking: values.reasonForWorking,
        fromDate: format(values.fromDate, DATE_FORMATS.API),
        toDate: format(values.toDate, DATE_FORMATS.API),
        durationType: values.durationType,
      };

      // Replace with actual API endpoint when available
      const response = await apiClient.post(API_PATHS.COMPOFF_REQUEST, payload);

      if (response.status === 200 || response.status === 201) {
        toast.success("Comp-Off request submitted successfully!", {
          description:
            "Your compensatory time off request has been sent for approval.",
        });

        form.reset();
      }
    } catch (error: any) {
      console.error("Error submitting comp-off request:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to submit comp-off request. Please try again.";

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
        <CardTitle className="text-2xl mb-2">Comp-Off Request</CardTitle>
        <CardDescription className="text-muted-foreground">
          Request compensatory time off for overtime work performed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Employee Selection Section */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="text-lg font-semibold">Employee Information</h3>
              <FormField
                control={form.control}
                name="employeeEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee Email</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingEmails}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isLoadingEmails
                                ? "Loading employees..."
                                : "Select employee email"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employeeEmails.map((email) => (
                          <SelectItem key={email} value={email}>
                            {email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the employee for whom this comp-off is being
                      requested
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Comp-Off Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Comp-Off Details</h3>

              <FormField
                control={form.control}
                name="reasonForWorking"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Working</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide details about the overtime work performed..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Explain why overtime work was required
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fromDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>From Date</FormLabel>
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
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Select the start date for comp-off
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>To Date</FormLabel>
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
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Select the end date for comp-off
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
                      onValueChange={field.onChange}
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
                      Specify whether this is a full day or half day comp-off
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Comp-Off Request"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
