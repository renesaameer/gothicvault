import * as React from "react";
import { cn } from "@/lib/utils";

interface FormRowProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  /** Render label + hint on the left and the control on the right (single row). */
  inline?: boolean;
  children: React.ReactNode;
}

const FormRow = ({ label, hint, error, required, htmlFor, className, inline, children }: FormRowProps) => {
  if (inline) {
    return (
      <div className={cn("flex items-center justify-between gap-3", className)}>
        <div className="min-w-0">
          {label && (
            <label htmlFor={htmlFor} className="block text-[13px] font-medium text-foreground/90">
              {label}
              {required && <span className="text-destructive/70 ml-0.5">*</span>}
            </label>
          )}
          {error ? (
            <p className="text-[11px] text-destructive mt-0.5">{error}</p>
          ) : hint ? (
            <p className="text-[11px] text-muted-foreground/55 mt-0.5 leading-relaxed">{hint}</p>
          ) : null}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[12px] font-medium text-foreground/80">
          {label}
          {required && <span className="text-destructive/70 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[11px] text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground/55 leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
};

export default FormRow;
