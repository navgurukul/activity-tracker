"use client";

import { AlertCircle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Project } from "@/lib/project-types";

import { ProjectEntryCard } from "./ProjectEntryCard";

interface Department {
  id: number;
  name: string;
  code: string;
  description?: string | null;
}

interface ProjectEntriesSectionProps {
  form: any;
  fields: Array<{ id: string }>;
  fieldCount: number;
  departments: Department[];
  projectsByDept: Record<string, Project[]>;
  projectSearchQuery: Record<number, string>;
  hoursInput: Record<number, string>;
  onDepartmentChange: (index: number, departmentCode: string) => void;
  onProjectSearchChange: (index: number, value: string) => void;
  onHoursInputChange: (index: number, value: string) => void;
  onHoursBlur: (index: number, perProjectMax: number, isAdHoc: boolean) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

export function ProjectEntriesSection({
  form,
  fields,
  fieldCount,
  departments,
  projectsByDept,
  projectSearchQuery,
  hoursInput,
  onDepartmentChange,
  onProjectSearchChange,
  onHoursInputChange,
  onHoursBlur,
  onRemove,
  onAdd,
}: ProjectEntriesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Activities</h3>
      </div>

      {fields.map((field, index) => (
        <ProjectEntryCard
          key={field.id}
          form={form}
          index={index}
          fieldCount={fieldCount}
          departments={departments}
          projectsByDept={projectsByDept}
          projectSearchQuery={projectSearchQuery}
          hoursInput={hoursInput}
          onDepartmentChange={onDepartmentChange}
          onProjectSearchChange={onProjectSearchChange}
          onHoursInputChange={onHoursInputChange}
          onHoursBlur={onHoursBlur}
          onRemove={onRemove}
        />
      ))}

      {form.formState.errors.projectEntries?.root && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>
            {form.formState.errors.projectEntries.root.message}
          </AlertDescription>
        </Alert>
      )}

      <Button type="button" variant="outline" size="lg" onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Add Another Project Activity
      </Button>
    </div>
  );
}
