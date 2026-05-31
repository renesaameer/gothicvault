import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "violet";

interface StatCardProps {
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  trend?: { value: string; positive?: boolean };
  tone?: Tone;
  className?: string;
}

const StatCard = ({ icon: Icon, label, value, sub, trend, tone = "neutral", className }: StatCardProps) => (
  <div className={cn("a-card a-card-hover p-4 sm:p-5", className)}>
    <div className="flex items-start justify-between gap-2 mb-3">
      <span
        className="text-[11px] font-medium uppercase tracking-[0.06em]"
        style={{ color: "hsl(var(--a-muted))" }}
      >
        {label}
      </span>
      {Icon && (
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", `a-tone-${tone}`)}>
          <Icon size={14} strokeWidth={2} />
        </div>
      )}
    </div>
    <p
      className="text-[24px] sm:text-[28px] font-semibold tracking-tight tabular-nums leading-none"
      style={{ color: "hsl(var(--a-ink))" }}
    >
      {value}
    </p>
    <div className="flex items-center gap-2 mt-2.5 min-h-[16px]">
      {trend && (
        <span
          className={cn(
            "text-[11px] font-medium px-1.5 py-0.5 rounded-md tabular-nums",
            trend.positive ? "a-tone-success" : "a-tone-danger",
          )}
        >
          {trend.positive ? "↑" : "↓"} {trend.value}
        </span>
      )}
      {sub && (
        <p className="text-[11px] leading-relaxed truncate" style={{ color: "hsl(var(--a-soft))" }}>
          {sub}
        </p>
      )}
    </div>
  </div>
);

export default StatCard;
