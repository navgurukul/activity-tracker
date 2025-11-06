/**
 * ProjectsTable Component
 * Displays projects in a table format
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export interface Project {
  id: number;
  name: string;
  code: string;
  status: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectsTableProps {
  projects: Project[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Department</TableHead>
          <TableHead>Project Name</TableHead>
          <TableHead>PM Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="font-medium">{project.name}</TableCell>
            <TableCell>{project.code}</TableCell>
            <TableCell>
              <Badge
                variant={project.status.toLowerCase() === "active" ? "default" : "neutral"}
                className={project.status.toLowerCase() === "archived" ? "bg-yellow-100 text-yellow-800 border-yellow-300" : ""}
              >
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell className="max-w-md truncate">
              {project.description || "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
