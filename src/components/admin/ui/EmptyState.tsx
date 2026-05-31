import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "violet";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  tone?: Tone;
  className?: string;
}

const EmptyState = ({ icon, title, description, action, tone = "neutral", className }: EmptyStateProps) => (
  <div className={cn("flex flex-col items-center justify-center text-center py-10 px-4", className)}>
    {icon && (
      <div className="relative mb-4">
        {/* halo */}
        <div
          className={cn("absolute inset-0 rounded-full blur-2xl opacity-60", `a-tone-${tone}`)}
          aria-hidden
          style={{ transform: "scale(1.4)" }}
        />
        <div
          className={cn(
            "relative w-14 h-14 rounded-2xl flex items-center justify-center",
            `a-tone-${tone}`,
          )}
          style={{ boxShadow: "var(--a-shadow-ring), var(--a-shadow-sm)" }}
        >
          {icon}
        </div>
      </div>
    )}
    <p className="text-[14px] font-semibold" style={{ color: "hsl(var(--a-ink))" }}>{title}</p>
    {description && (
      <p className="text-[12.5px] mt-1.5 max-w-sm leading-relaxed" style={{ color: "hsl(var(--a-muted))" }}>
        {description}
      </p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
