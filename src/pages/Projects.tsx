

import { useState, useEffect } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageWrapper } from "@/components/layout/wrapper";
import { EmptyState } from "./Projects/EmptyState";
import { LoadingState } from "./Projects/LoadingState";
import { ProjectFilters } from "./Projects/ProjectFilters";
import { ProjectsTable, Project } from "./Projects/ProjectsTable";
import apiClient from "@/lib/api-client";
import { API_PATHS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

export default function ProjectManagementPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Fetch projects from API
  useEffect(() => {
    if (authLoading) return;
    fetchProjects();
  }, [statusFilter, searchTerm, user?.orgId, authLoading]);

  const fetchProjects = async (): Promise<void> => {
    // Don't fetch if auth is still loading
    if (authLoading) return;

    // Guard against missing orgId
    if (!user?.orgId) {
      toast.error("Organization ID not found", {
        description: "Please sign in again or contact admin.",
      });
      return;
    }

    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        orgId: user.orgId,
      };

      // Add status filter if not "all"
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      // Add search term if provided
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await apiClient.get(API_PATHS.PROJECTS, { params });

      if (response.data) {
        setProjects(Array.isArray(response.data) ? response.data : []);
        console.log("Projects fetched successfully:", response.data);
      }
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch projects. Please try again.";
      toast.error("Failed to load projects", {
        description: errorMessage,
      });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (): void => {
    setSearchTerm(searchInput);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClearSearch = (): void => {
    setSearchInput("");
    setSearchTerm("");
  };

  const handleStatusChange = (value: string): void => {
    setStatusFilter(value);
  };

  return (
    <>
      <AppHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Project Management" },
        ]}
      />
      <PageWrapper>
        <div className="flex w-full justify-center p-4">
          <Card className="mx-auto w-full min-w-[120px] max-w-[80vw] sm:max-w-xs md:max-w-lg lg:max-w-2xl xl:max-w-3xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl mb-2">
                    Project Management
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Manage and organize all projects in your organization
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Filter Controls */}
                <ProjectFilters
                  statusFilter={statusFilter}
                  onStatusChange={handleStatusChange}
                  searchInput={searchInput}
                  onSearchInputChange={setSearchInput}
                  onSearch={handleSearch}
                  onClearSearch={handleClearSearch}
                  onSearchKeyPress={handleSearchKeyPress}
                />

                {/* Projects Table */}
                <div className="rounded-base border-2 border-border">
                  {loading ? (
                    <LoadingState />
                  ) : projects.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <ProjectsTable projects={projects} />
                  )}
                </div>

                {/* Results Summary */}
                {!loading && projects.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Showing {projects.length} project
                    {projects.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}

