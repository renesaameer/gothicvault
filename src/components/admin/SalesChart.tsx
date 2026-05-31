import { useEffect, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { CURRENCY_SYMBOL } from "@/lib/currency";

export interface SalesPoint { label: string; revenue: number; orders: number; }

// Resolve HSL tokens to concrete strings once, with fallbacks. Recharts gets confused
// if a color prop momentarily resolves to an invalid value during the first paint.
const resolveColor = (token: string, fallback: string): string => {
  if (typeof window === "undefined") return fallback;
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    return v ? `hsl(${v})` : fallback;
  } catch {
    return fallback;
  }
};

const SalesChart = ({ data, dense }: { data: SalesPoint[]; dense?: boolean }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [colors] = useState(() => ({
    ink: resolveColor("--a-ink", "#111111"),
    muted: resolveColor("--a-muted", "#6b6b6b"),
    stroke: resolveColor("--a-stroke", "rgba(0,0,0,0.08)"),
  }));

  // Wait until the parent has a real size before mounting ResponsiveContainer.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const check = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setReady(true);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-full h-full">
      {ready && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={dense ? 12 : 20}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.stroke} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: colors.muted }}
              tickLine={false}
              axisLine={false}
              interval={dense ? 3 : "preserveStartEnd"}
            />
            <YAxis
              tick={{ fontSize: 11, fill: colors.muted }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${CURRENCY_SYMBOL}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: `1px solid ${colors.stroke}`,
                fontSize: "12px",
                boxShadow: "0 8px 24px -4px rgba(0,0,0,0.12)",
              }}
              formatter={(value: number, name: string) => [
                name === "revenue" ? `${CURRENCY_SYMBOL}${value.toLocaleString()}` : value,
                name === "revenue" ? "Revenue" : "Orders",
              ]}
            />
            <Bar dataKey="revenue" fill={colors.ink} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default SalesChart;
