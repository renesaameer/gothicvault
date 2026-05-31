import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader = ({ title, subtitle, actions, className }: PageHeaderProps) => (
  <div className={cn("flex items-start sm:items-center justify-between gap-3 mb-5", className)}>
    <div className="min-w-0">
      <h1
        className="text-[20px] sm:text-[24px] font-semibold tracking-tight truncate"
        style={{ color: "hsl(var(--a-ink))", letterSpacing: "-0.02em" }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="text-[13px] mt-1" style={{ color: "hsl(var(--a-muted))" }}>
          {subtitle}
        </p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

export default PageHeader;
