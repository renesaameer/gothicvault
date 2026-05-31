import * as React from "react";
import { cn } from "@/lib/utils";

interface StickyActionBarProps {
  visible: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}

const StickyActionBar = ({ visible, message, children, className }: StickyActionBarProps) => {
  if (!visible) return null;
  return (
    <div
      className={cn(
        "sticky bottom-0 left-0 right-0 z-20 mt-6 -mx-3 sm:-mx-5 px-3 sm:px-5 py-3",
        "flex items-center justify-between gap-3",
        "pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
        "animate-slide-up-bar",
        className,
      )}
      style={{
        background: "hsl(var(--a-surface) / 0.92)",
        backdropFilter: "blur(14px) saturate(180%)",
        WebkitBackdropFilter: "blur(14px) saturate(180%)",
        boxShadow: "inset 0 1px 0 hsl(var(--a-stroke)), 0 -8px 24px -8px rgba(16,24,40,0.10)",
      }}
    >
      <span className="text-[12px] truncate" style={{ color: "hsl(var(--a-muted))" }}>
        {message ?? "You have unsaved changes"}
      </span>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  );
};

export default StickyActionBar;
