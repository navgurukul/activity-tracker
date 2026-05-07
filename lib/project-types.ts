export type ProjectStatus = "active" | "inactive" | "hold" | "completed";

export interface Project {
  id: number;
  name: string;
  code: string;
  status?: ProjectStatus;
}
