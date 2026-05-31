"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionStyle } from "motion/react";
import { cn } from "@/lib/utils";
import { PackageIcon, TruckIcon, CheckCircleIcon, ClockIcon } from "@/components/ui/icons";

export type OrderTrackingStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered";

interface OrderTrackingParallaxCardProps {
  orderId: string;
  product: string;
  status: OrderTrackingStatus;
  eta?: string;
  total?: string;
  className?: string;
}

const STEPS: { key: OrderTrackingStatus; label: string; Icon: any }[] = [
  { key: "pending", label: "Pending", Icon: ClockIcon },
  { key: "confirmed", label: "Confirmed", Icon: CheckCircleIcon },
  { key: "processing", label: "Processing", Icon: PackageIcon },
  { key: "shipped", label: "Shipped", Icon: TruckIcon },
  { key: "delivered", label: "Delivered", Icon: CheckCircleIcon },
];

export const OrderTrackingParallaxCard = React.forwardRef<
  HTMLDivElement,
  OrderTrackingParallaxCardProps
>(({ orderId, product, status, eta, total, className }, ref) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springCfg = { stiffness: 220, damping: 25, mass: 0.6 };
  const xs = useSpring(x, springCfg);
  const ys = useSpring(y, springCfg);

  const rotateX = useTransform(ys, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(xs, [-0.5, 0.5], ["-8deg", "8deg"]);
  const tzHero = useTransform(ys, [-0.5, 0.5], [-30, 30]);
  const tzContent = useTransform(ys, [-0.5, 0.5], [22, -22]);
  const tzProgress = useTransform(ys, [-0.5, 0.5], [32, -32]);
  const tzGlow = useTransform(ys, [-0.5, 0.5], [-50, 50]);

  const reduced = React.useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const activeStep = STEPS.findIndex((s) => s.key === status);
  const progressPct = Math.max(0, activeStep) / (STEPS.length - 1) * 100;

  return (
    <div className={cn("[perspective:1400px] w-full", className)}>
      <motion.div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={
          {
            rotateX: reduced ? 0 : rotateX,
            rotateY: reduced ? 0 : rotateY,
            transformStyle: "preserve-3d",
          } as MotionStyle
        }
        className="relative rounded-[28px] border border-border/40 bg-gradient-to-br from-secondary/40 via-card/60 to-background/30 backdrop-blur-xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        {/* Ambient parallax glow */}
        <motion.div
          aria-hidden
          style={{ z: tzGlow as any, transformStyle: "preserve-3d" }}
          className="pointer-events-none absolute -inset-10 opacity-70"
        >
          <div
            className="absolute inset-0 blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse at 30% 0%, hsl(var(--primary) / 0.28), transparent 55%), radial-gradient(ellipse at 70% 100%, hsl(var(--primary) / 0.18), transparent 55%)",
            }}
          />
        </motion.div>

        {/* Inner hairline */}
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/[0.05]" />

        <div className="relative p-6 sm:p-8">
          {/* Header */}
          <motion.div
            style={{ z: tzContent as any, transformStyle: "preserve-3d" }}
            className="flex items-start justify-between gap-4 mb-6"
          >
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.42em] text-muted-foreground font-display mb-2">
                The Vault · In Transit
              </div>
              <h3 className="text-2xl sm:text-[28px] font-semibold tracking-[-0.025em] text-foreground leading-tight truncate">
                {product}
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 tracking-wide">
                Order <span className="text-foreground/90 font-medium">#{orderId}</span>
              </p>
            </div>

            {/* Status badge */}
            <div className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md px-3 py-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-primary/70 animate-ping" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              <span className="text-[10px] uppercase tracking-[0.28em] text-primary font-medium">
                {STEPS[activeStep]?.label ?? status}
              </span>
            </div>
          </motion.div>

          {/* Hero parallax tile */}
          <motion.div
            style={{ z: tzHero as any, transformStyle: "preserve-3d" }}
            className="relative h-32 sm:h-36 rounded-2xl border border-border/40 overflow-hidden mb-6 bg-gradient-to-br from-background/60 to-secondary/40"
          >
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.35), transparent 65%)",
              }}
            />
            {/* Animated drifting truck/parcel icon */}
            <motion.div
              animate={{ x: ["-20%", "120%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 -translate-y-1/2 left-0 text-primary/90"
            >
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-primary/20 blur-xl" />
                <TruckIcon size={42} className="relative" />
              </div>
            </motion.div>
            {/* Road */}
            <div className="absolute bottom-4 inset-x-4 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="absolute bottom-4 inset-x-4 h-px [background-image:repeating-linear-gradient(90deg,hsl(var(--primary)/0.5)_0_8px,transparent_8px_18px)] opacity-50" />
            {eta && (
              <div className="absolute bottom-2 right-3 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                ETA · <span className="text-foreground/90">{eta}</span>
              </div>
            )}
            {total && (
              <div className="absolute top-2 left-3 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Total · <span className="text-foreground/90 tabular-nums">{total}</span>
              </div>
            )}
          </motion.div>

          {/* Progress tracker */}
          <motion.div
            style={{ z: tzProgress as any, transformStyle: "preserve-3d" }}
            className="relative"
          >
            <div className="flex items-center justify-between relative px-1">
              <div className="absolute top-[18px] left-0 right-0 h-px bg-border/40" />
              <motion.div
                className="absolute top-[18px] left-0 h-px bg-gradient-to-r from-primary/40 via-primary to-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
              {STEPS.map((s, i) => {
                const isActive = i <= activeStep;
                const isCurrent = i === activeStep;
                const Icon = s.Icon;
                return (
                  <div key={s.key} className="relative z-10 flex flex-col items-center">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500",
                        isActive
                          ? "bg-gradient-to-b from-primary/90 to-primary text-primary-foreground shadow-[0_4px_18px_-4px_hsl(var(--primary)/0.7)]"
                          : "bg-secondary/60 text-muted-foreground/60 border border-border/40",
                        isCurrent && "ring-[3px] ring-primary/25 scale-110"
                      )}
                    >
                      <Icon size={14} />
                    </div>
                    <span
                      className={cn(
                        "text-[9px] mt-1.5 uppercase tracking-[0.18em]",
                        isActive ? "text-foreground" : "text-muted-foreground/60"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
});
OrderTrackingParallaxCard.displayName = "OrderTrackingParallaxCard";
