"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/app/_components/AppHeader";
import { PageWrapper } from "@/app/_components/wrapper";
import { CompOffRequestForm } from "./_components/CompOffRequestForm";
import { RoleProtectedRoute } from "@/app/_components/RoleProtectedRoute";
import { ROLES } from "@/lib/rbac-constants";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CompOffScope = "my_off_day_work" | "my_reportees" | "all_org";

export default function CompOffPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<CompOffScope>("my_reportees");

  const normalizedRoleSet = useMemo(() => {
    const rawRoles = (user as any)?.roles;
    if (Array.isArray(rawRoles)) {
      return new Set(
        rawRoles
          .map((role) => String(role).toLowerCase().replace(/[_\s-]/g, ""))
          .filter(Boolean)
      );
    }
    if (typeof rawRoles === "string") {
      return new Set([rawRoles.toLowerCase().replace(/[_\s-]/g, "")]);
    }
    return new Set<string>();
  }, [user]);

  const canAccessAllOrg = useMemo(() => {
    return (
      normalizedRoleSet.has("admin") || normalizedRoleSet.has("superadmin")
    );
  }, [normalizedRoleSet]);

  const canAccessReportees = useMemo(() => {
    return (
      normalizedRoleSet.has("manager") ||
      normalizedRoleSet.has("admin") ||
      normalizedRoleSet.has("superadmin")
    );
  }, [normalizedRoleSet]);

  return (
    <>
      <RoleProtectedRoute
        requiredRoles={[ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      >
        <AppHeader
          crumbs={[]}
          className="h-auto min-h-11 py-2"
          left={
            <Tabs
              value={scope}
              onValueChange={(value) => {
                if (value === "my_off_day_work") {
                  setScope(value as CompOffScope);
                  return;
                }
                if (value === "all_org" && !canAccessAllOrg) return;
                if (value === "my_reportees" && !canAccessReportees) return;
                setScope(value as CompOffScope);
              }}
            >
              <TabsList className="gap-2">
                <TabsTrigger value="my_off_day_work">
                  My Off Day Work
                </TabsTrigger>
                {canAccessReportees && (
                  <TabsTrigger value="my_reportees">My Reportees</TabsTrigger>
                )}
                {canAccessAllOrg && (
                  <TabsTrigger value="all_org">All Org</TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          }
        />
        <PageWrapper>
          <div className="flex w-full justify-center p-4">
            <CompOffRequestForm scope={scope} />
          </div>
        </PageWrapper>
      </RoleProtectedRoute>
    </>
  );
}
