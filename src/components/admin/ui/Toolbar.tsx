import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  filters?: React.ReactNode;
  primaryAction?: React.ReactNode;
  className?: string;
}

const Toolbar = ({ search, filters, primaryAction, className }: ToolbarProps) => (
  <div className={cn("flex flex-col sm:flex-row sm:items-center gap-2 mb-4", className)}>
    {search && (
      <div className="relative flex-1 min-w-0">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "hsl(var(--a-soft))" }}
        />
        <input
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          placeholder={search.placeholder ?? "Search…"}
          className="a-input !h-10 !pl-9"
        />
      </div>
    )}
    {(filters || primaryAction) && (
      <div className="flex items-center gap-2">
        {filters}
        {primaryAction}
      </div>
    )}
  </div>
);

export default Toolbar;
