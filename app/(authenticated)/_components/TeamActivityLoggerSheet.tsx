"use client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { VALIDATION } from "@/lib/constants";
import { DepartmentOption, ProjectOption } from "@/lib/dashboard-type";

interface TeamLoggerFormState {
  workDate: string;
  departmentId: string;
  projectId: string;
  hours: string;
  activities: string;
}

interface TeamActivityLoggerSheetProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isSubmitting: boolean;
  teamUser: any | null;
  teamDepartments: DepartmentOption[];
  teamProjectsByDepartment: Record<string, ProjectOption[]>;
  teamLoggerProjectsLoading: boolean;
  teamLoggerForm: TeamLoggerFormState;
  setTeamLoggerForm: (next: TeamLoggerFormState | ((prev: TeamLoggerFormState) => TeamLoggerFormState)) => void;
  fetchTeamLoggerProjectsForDepartment: (departmentId: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const TeamActivityLoggerSheet = ({
  isOpen,
  setIsOpen,
  isSubmitting,
  teamUser,
  teamDepartments,
  teamProjectsByDepartment,
  teamLoggerProjectsLoading,
  teamLoggerForm,
  setTeamLoggerForm,
  fetchTeamLoggerProjectsForDepartment,
  onSubmit,
}: TeamActivityLoggerSheetProps) => {
  const selectedProject = (teamProjectsByDepartment[teamLoggerForm.departmentId] || []).find(
    (project) => String(project.id) === teamLoggerForm.projectId
  );
  const isAdHocTaskSelected = Boolean(
    selectedProject?.name && /ad[- ]?hoc task/i.test(selectedProject.name)
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-full sm:w-[520px] p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="px-6 py-5 border-b border-border">
            <SheetTitle>Team Activity Logger</SheetTitle>
            <SheetDescription>
              Add activity log for selected team member.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Team Member</Label>
              <p className="text-sm font-medium text-foreground break-all">
                {teamUser?.email ||
                  teamUser?.workEmail ||
                  teamUser?.officialEmail ||
                  teamUser?.user?.email ||
                  teamUser?.searchedEmail ||
                  "Email not available"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label htmlFor="team-activity-date">Work Date</Label>
                <Input
                  id="team-activity-date"
                  type="date"
                  value={teamLoggerForm.workDate}
                  onChange={(e) =>
                    setTeamLoggerForm((prev) => ({
                      ...prev,
                      workDate: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="team-activity-department">
                Current Working Department
              </Label>
              <Select
                value={teamLoggerForm.departmentId}
                onValueChange={(nextDepartmentId) => {
                  setTeamLoggerForm((prev) => ({
                    ...prev,
                    departmentId: nextDepartmentId,
                    projectId: "",
                  }));
                  if (nextDepartmentId) {
                    fetchTeamLoggerProjectsForDepartment(nextDepartmentId);
                  }
                }}
              >
                <SelectTrigger id="team-activity-department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {teamDepartments.map((department) => (
                    <SelectItem key={department.id} value={String(department.id)}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="team-activity-project">Project</Label>
              <Select
                value={teamLoggerForm.projectId}
                onValueChange={(value) =>
                  setTeamLoggerForm((prev) => ({
                    ...prev,
                    projectId: value,
                  }))
                }
                disabled={!teamLoggerForm.departmentId || teamLoggerProjectsLoading}
              >
                <SelectTrigger id="team-activity-project">
                  <SelectValue
                    placeholder={
                      !teamLoggerForm.departmentId
                        ? "Select department first"
                        : teamLoggerProjectsLoading
                          ? "Loading projects..."
                          : "Select project"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(teamProjectsByDepartment[teamLoggerForm.departmentId] || []).map(
                    (project) => (
                      <SelectItem key={project.id} value={String(project.id)}>
                        {project.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="team-activity-hours">Hours</Label>
              <Input
                id="team-activity-hours"
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={teamLoggerForm.hours}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  setTeamLoggerForm((prev) => ({
                    ...prev,
                    hours: val,
                  }));
                }}
                disabled={!teamLoggerForm.projectId || teamLoggerProjectsLoading}
                required
              />
              {isAdHocTaskSelected && (
                <p className="text-sm text-muted-foreground">
                  Ad hoc task entries are limited to a maximum of 2 hours per day.
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="team-activity-description">Activities</Label>
              <Textarea
                id="team-activity-description"
                placeholder="Describe the work done"
                value={teamLoggerForm.activities}
                onChange={(e) =>
                  setTeamLoggerForm((prev) => ({
                    ...prev,
                    activities: e.target.value,
                  }))
                }
                minLength={VALIDATION.MIN_TASK_DESCRIPTION_LENGTH}
                required
              />
            </div>

            <div className="pt-3 flex items-center gap-2.5">
              <Button
                type="submit"
                disabled={isSubmitting || !teamUser}
                className="min-w-[150px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Activity Log"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};
