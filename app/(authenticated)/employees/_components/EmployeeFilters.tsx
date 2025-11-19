/**
 * EmployeeFilters Component
 * Filter controls for employee search and filtering
 */

import { Search, X, CornerDownLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmployeeFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  onSearchKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  managerFilter: string;
  onManagerFilterChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  managers: Array<{ id: number; name: string }>;
  roles: Record<string, string>;
}

export function EmployeeFilters({
  searchInput,
  onSearchInputChange,
  onSearch,
  onClearSearch,
  onSearchKeyPress,
  managerFilter,
  onManagerFilterChange,
  roleFilter,
  onRoleFilterChange,
  managers,
  roles,
}: EmployeeFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, email..."
            className="pl-8 pr-8"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyPress={onSearchKeyPress}
          />
          {searchInput && (
            <button
              onClick={onClearSearch}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="noShadow" onClick={onSearch}>
            <CornerDownLeft
              strokeWidth={3}
              className=" h-5 w-5 bg-white p-0.5 rounded-sm border"
            />
            Search
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Select value={managerFilter} onValueChange={onManagerFilterChange}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Managers</SelectItem>
            {managers.map((manager) => (
              <SelectItem key={manager.id} value={manager.id.toString()}>
                {manager.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={onRoleFilterChange}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.entries(roles).map(([displayName, roleValue]) => (
              <SelectItem key={roleValue} value={roleValue}>
                {displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
