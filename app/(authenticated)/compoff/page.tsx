"use client";

import { ProtectedRoute } from "@/app/_components/ProtectedRoute";
import { OffDayWorkDashboard } from "./_components/OffDayWorkDashboard";

export default function CompOffPage() {
  return (
    <ProtectedRoute>
      <OffDayWorkDashboard />
    </ProtectedRoute>
  );
}
