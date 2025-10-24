'use client';

import React from "react";
import { ProtectedRoute } from "@/app/_components/ProtectedRoute";

function page() {
  return (
    <ProtectedRoute>
      <div>page</div>
    </ProtectedRoute>
  );
}

export default page;
