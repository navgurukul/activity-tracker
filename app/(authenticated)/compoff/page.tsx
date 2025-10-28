"use client";

import { AppHeader } from "@/app/_components/AppHeader";
import { PageWrapper } from "@/app/_components/wrapper";
import { CompOffRequestForm } from "./_components/CompOffRequestForm";

export default function CompOffPage() {
  return (
    <>
      <AppHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Comp-Off Request" },
        ]}
      />
      <PageWrapper>
        <div className="flex w-full justify-center p-4">
          <CompOffRequestForm />
        </div>
      </PageWrapper>
    </>
  );
}
