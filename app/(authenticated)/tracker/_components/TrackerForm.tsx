"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { TrackerFormProps } from "@/lib/tracker-types";

export function TrackerForm({
  form,
  onSubmit,
  isSubmitting,
  children,
}: TrackerFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {children}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Submit Activity Logger"}
        </Button>
      </form>
    </Form>
  );
}