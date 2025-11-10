
import { Fragment } from "react";

import { Moon, Sun } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

export type Crumb = {
  label: string;
  href?: string;
};

interface AppHeaderProps {
  crumbs: Crumb[];
  className?: string;
  right?: React.ReactNode;
}

export function AppHeader({ crumbs, className, right }: AppHeaderProps) {
  const lastIndex = crumbs.length - 1;
  const { effectiveTheme, toggleTheme } = useTheme();

  return (
    <header
      className={cn(
        "flex h-14 sm:pe-6 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-14 border-b-2 border-b-border",
        className
      )}
    >
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, i) => {
              const isLast = i === lastIndex;
              return (
                <Fragment key={`${crumb.label}-${i}`}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href ?? "#"}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="ml-auto px-4 flex items-center gap-2">
        {right}
        <Button
          variant="neutral"
          size="icon"
          className="size-9 p-0 [&_svg]:size-5"
          onClick={toggleTheme}
        >
          <Sun className="hidden dark:inline stroke-foreground" />
          <Moon className="inline dark:hidden stroke-foreground" />
        </Button>
      </div>
    </header>
  );
}
