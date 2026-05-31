import * as React from "react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface DataColumn<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}

interface DataListProps<T> {
  rows: T[];
  rowKey: (row: T) => string;
  columns: DataColumn<T>[];
  mobileCard: (row: T) => React.ReactNode;
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
}

function DataList<T>({ rows, rowKey, columns, mobileCard, empty, onRowClick, className }: DataListProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  return (
    <div className={cn("w-full", className)}>
      {/* Mobile cards */}
      <div className="lg:hidden space-y-2">
        {rows.map((r) => (
          <div
            key={rowKey(r)}
            onClick={() => onRowClick?.(r)}
            className={cn(
              "a-card a-card-hover p-3.5",
              onRowClick && "cursor-pointer active:scale-[0.995] transition-transform",
            )}
          >
            {mobileCard(r)}
          </div>
        ))}
      </div>
      {/* Desktop table */}
      <div className="hidden lg:block a-table-wrap">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-0">
              {columns.map((c) => (
                <TableHead
                  key={c.key}
                  className={cn(
                    "text-[11px] uppercase tracking-[0.06em] font-medium h-10 border-0",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                    c.className,
                  )}
                  style={{ color: "hsl(var(--a-muted))" }}
                >
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow
                key={rowKey(r)}
                onClick={() => onRowClick?.(r)}
                className={cn(
                  "border-0 transition-colors",
                  "[&>td]:border-t [&>td]:border-[hsl(var(--a-divider))]",
                  onRowClick && "cursor-pointer hover:bg-[hsl(var(--a-surface-2))]",
                )}
              >
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    className={cn(
                      "text-[13px] py-3",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.className,
                    )}
                    style={{ color: "hsl(var(--a-text))" }}
                  >
                    {c.render(r)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default DataList;
