"use client";

import { AppHeader } from "@/app/_components/AppHeader";
import { PageWrapper } from "@/app/_components/wrapper";
import { LeaveApplicationForm } from "./_components/LeaveApplicationForm";
import {
  AllocatedLeavesTable,
  type AllocatedLeave,
} from "./_components/AllocatedLeavesTable";
import { mockDataService } from "@/lib/mock-data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function LeaveApplicationPage() {
  // Mock data - will be replaced with actual API calls
  const userData = mockDataService.getCurrentUser();
  const allocatedLeaves = mockDataService.getAllocatedLeaves();

  return (
    <>
      <AppHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Leave Application" },
        ]}
      />
      <PageWrapper>
        <div className="w-full p-4 flex flex-col gap-4">
          <div className="mx-auto w-full min-w-[120px] max-w-[80vw] sm:max-w-xs md:max-w-lg lg:max-w-2xl xl:max-w-3xl">
            <Accordion type="single" collapsible defaultValue="item-1">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <span className="text-lg font-semibold">
                    Allocated Leaves
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <AllocatedLeavesTable leaves={allocatedLeaves} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <LeaveApplicationForm userEmail={userData.email} />
        </div>
      </PageWrapper>
    </>
  );
}
