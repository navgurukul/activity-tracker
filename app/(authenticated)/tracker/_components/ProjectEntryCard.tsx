import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { VALIDATION } from "@/lib/constants";
import { FieldArrayWithId, UseFieldArrayRemove, UseFormSetValue, UseFormWatch } from "react-hook-form";

interface ProjectEntryCardProps {
  index: number;
  field: FieldArrayWithId<any, "projectEntries", "id">;
  fieldsLength: number;
  departments: Array<{ id: number; name: string; code: string }>;
  projectsByDept: Record<
    string,
    Array<{ id: number; name: string; code: string; status?: string }>
  >;
  projectSearchQuery: Record<number, string>;
  hoursInput: Record<number, string>;
  control: any;
  remove: UseFieldArrayRemove;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  setProjectSearchQuery: (value: any) => void;
  setHoursInput: (value: any) => void;
  fetchProjectsForDepartment: (deptCode: string) => void;
  sanitizeHoursDisplay: (
    raw: string,
    perProjectMax: number,
    isAdHoc: boolean
  ) => { num: number; display: string };
}

export function ProjectEntryCard({
  index,
  field,
  fieldsLength,
  departments,
  projectsByDept,
  projectSearchQuery,
  hoursInput,
  control,
  remove,
  watch,
  setValue,
  setProjectSearchQuery,
  setHoursInput,
  fetchProjectsForDepartment,
  sanitizeHoursDisplay,
}: ProjectEntryCardProps) {
  const selectedDeptCode = watch(`projectEntries.${index}.currentWorkingDepartment`);
  const selectedProjId = watch(`projectEntries.${index}.projectId`);
  const projectOptions = projectsByDept[selectedDeptCode] || [];
  const filteredProjects = projectOptions.filter(
    (project) =>
      project.status?.toLowerCase() === "active" &&
      (project.name
        .toLowerCase()
        .includes((projectSearchQuery[index] || "").toLowerCase()) ||
        project.code
          .toLowerCase()
          .includes((projectSearchQuery[index] || "").toLowerCase()))
  );

  const selectedProject = projectOptions.find(
    (p) => p.id.toString() === selectedProjId
  );
  const isAdHoc = selectedProject?.name === "Ad-hoc tasks";
  const perProjectMax = isAdHoc ? 2 : VALIDATION.MAX_HOURS_PER_ENTRY;
  const maxIntLen = String(perProjectMax).length;

  return (
    <div className="p-4 border-2 border-border rounded-base space-y-4">
      {/* Entry Header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">Project Entry #{index + 1}</h4>
        {fieldsLength > 1 && (
          <Button
            type="button"
            variant="noShadow"
            size="sm"
            onClick={() => remove(index)}
            aria-label="Remove project entry"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Department & Project Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Department Field */}
        <FormField
          control={control}
          name={`projectEntries.${index}.currentWorkingDepartment`}
          render={({ field: deptField }) => (
            <FormItem>
              <FormLabel>Project Department</FormLabel>
              <Select
                onValueChange={(value) => {
                  deptField.onChange(value);
                  setValue(`projectEntries.${index}.projectId`, "");
                  setProjectSearchQuery((prev: any) => ({
                    ...prev,
                    [index]: "",
                  }));
                  fetchProjectsForDepartment(value);
                }}
                defaultValue={deptField.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the department for this project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.code}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Project Field */}
        <FormField
          control={control}
          name={`projectEntries.${index}.projectId`}
          render={({ field: projectField }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <Select
                onValueChange={projectField.onChange}
                value={projectField.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/* Search Input */}
                  <div className="px-2 pb-2">
                    <Input
                      placeholder="Search projects..."
                      value={projectSearchQuery[index] || ""}
                      onChange={(e) => {
                        setProjectSearchQuery((prev: any) => ({
                          ...prev,
                          [index]: e.target.value,
                        }));
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-8"
                    />
                  </div>

                  {/* Project List */}
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
          )}
        />
      </div>

      {/* Hours Field */}
      <FormField
        control={control}
        name={`projectEntries.${index}.hoursSpent`}
        render={({ field: hoursField }) => {
          const display = hoursInput[index] ?? (
            hoursField.value === undefined || hoursField.value === null
              ? ""
              : String(hoursField.value)
          );

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
                      v =
                        v.slice(0, dot + 1) +
                        v.slice(dot + 1).replace(/\./g, "");
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
                    setHoursInput((prev: any) => ({ ...prev, [index]: v }));
                  }}
                  onBlur={() => {
                    const { num, display: sanitized } = sanitizeHoursDisplay(
                      hoursInput[index],
                      perProjectMax,
                      isAdHoc
                    );
                    hoursField.onChange(num);
                    setHoursInput((prev: any) => ({
                      ...prev,
                      [index]: sanitized,
                    }));
                  }}
                />
              </FormControl>
              <FormDescription>
                Maximum 12 hours total across all entries for the day.
              </FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      {/* Task Description Field */}
      <FormField
        control={control}
        name={`projectEntries.${index}.taskDescription`}
        render={({ field: taskField }) => (
          <FormItem>
            <FormLabel>Task Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe your task, achievements, and progress made..."
                className="min-h-[100px] resize-none"
                {...taskField}
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
  );
}
