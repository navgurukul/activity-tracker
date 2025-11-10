import { AppHeader } from "@/components/layout/AppHeader";
import { PageWrapper } from "@/components/layout/wrapper";
import { CompOffRequestForm } from "./CompOffRequestForm";

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