import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus } from "lucide-react";
import { ProjectEntryCard } from "./ProjectEntryCard";
import { FieldArrayWithId, UseFieldArrayRemove, UseFormSetValue, UseFormWatch } from "react-hook-form";

interface ProjectActivitiesSectionProps {
  fields: FieldArrayWithId<any, "projectEntries", "id">[];
  departments: Array<{ id: number; name: string; code: string }>;
  projectsByDept: Record<
    string,
    Array<{ id: number; name: string; code: string; status?: string }>
  >;
  projectSearchQuery: Record<number, string>;
  hoursInput: Record<number, string>;
  errors: any;
  control: any;
  remove: UseFieldArrayRemove;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  setProjectSearchQuery: (value: any) => void;
  setHoursInput: (value: any) => void;
  onAddEntry: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  fetchProjectsForDepartment: (deptCode: string) => void;
  sanitizeHoursDisplay: (
    raw: string,
    perProjectMax: number,
    isAdHoc: boolean
  ) => { num: number; display: string };
}

export function ProjectActivitiesSection({
  fields,
  departments,
  projectsByDept,
  projectSearchQuery,
  hoursInput,
  errors,
  control,
  remove,
  watch,
  setValue,
  setProjectSearchQuery,
  setHoursInput,
  onAddEntry,
  onSubmit,
  isSubmitting,
  fetchProjectsForDepartment,
  sanitizeHoursDisplay,
}: ProjectActivitiesSectionProps) {
  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Activities</h3>
      </div>

      {/* Project Entry Cards */}
      {fields.map((field, index) => (
        <ProjectEntryCard
          key={field.id}
          index={index}
          field={field}
          fieldsLength={fields.length}
          departments={departments}
          projectsByDept={projectsByDept}
          projectSearchQuery={projectSearchQuery}
          hoursInput={hoursInput}
          control={control}
          remove={remove}
          watch={watch}
          setValue={setValue}
          setProjectSearchQuery={setProjectSearchQuery}
          setHoursInput={setHoursInput}
          fetchProjectsForDepartment={fetchProjectsForDepartment}
          sanitizeHoursDisplay={sanitizeHoursDisplay}
        />
      ))}

      {/* Total Hours Validation Error */}
      {errors?.projectEntries?.root && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>
            {errors.projectEntries.root.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onAddEntry}
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
          onClick={onSubmit}
        >
          {isSubmitting ? "Submitting..." : "Submit Activity Logger"}
        </Button>
      </div>
    </div>
  );
}
