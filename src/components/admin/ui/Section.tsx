import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  /** flush = no padding (good for tables/lists) */
  flush?: boolean;
  /** transparent = no surface (good for nested groups) */
  transparent?: boolean;
  children: React.ReactNode;
}

const Section = ({
  title, description, actions, className, bodyClassName, flush, transparent, children,
}: SectionProps) => (
  <section className={cn(transparent ? "" : "a-card", className)}>
    {(title || actions) && (
      <header
        className={cn(
          "flex items-start justify-between gap-3",
          transparent ? "mb-3" : "px-4 sm:px-5 pt-4 sm:pt-5",
        )}
      >
        <div className="min-w-0">
          {title && (
            <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: "hsl(var(--a-ink))" }}>
              {title}
            </h2>
          )}
          {description && (
            <p className="text-[12px] mt-0.5" style={{ color: "hsl(var(--a-muted))" }}>
              {description}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-1.5">{actions}</div>}
      </header>
    )}
    <div className={cn(transparent || flush ? "" : "p-4 sm:p-5", bodyClassName)}>{children}</div>
  </section>
);

export default Section;
