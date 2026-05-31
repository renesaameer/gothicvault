"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionStyle } from "motion/react";
import { cn } from "@/lib/utils";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max tilt angle in degrees. Default 8 — subtle, premium. */
  intensity?: number;
  /** Disable tilt (e.g. on touch devices). */
  disabled?: boolean;
  /** Perspective in px. */
  perspective?: number;
  /** Whether to lift the card slightly on hover. */
  lift?: boolean;
  children: React.ReactNode;
}

/**
 * Subtle 3D tilt wrapper. Wrap any card with <TiltCard>...</TiltCard>.
 * Pointer-only (skips touch). Honours prefers-reduced-motion.
 */
export const TiltCard = React.forwardRef<HTMLDivElement, TiltCardProps>(
  ({ children, className, intensity = 8, disabled = false, perspective = 1000, lift = true, style, ...rest }, ref) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 20, stiffness: 180, mass: 0.6 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    const rotateX = useTransform(springY, [-0.5, 0.5], [`${intensity}deg`, `-${intensity}deg`]);
    const rotateY = useTransform(springX, [-0.5, 0.5], [`-${intensity}deg`, `${intensity}deg`]);

    const reducedMotion = React.useMemo(
      () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
      []
    );
    const isActive = !disabled && !reducedMotion;

    const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isActive || e.pointerType === "touch") return;
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
      mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    const handleLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    return (
      <div style={{ perspective: `${perspective}px` }} className={cn("h-full", className)}>
        <motion.div
          ref={ref}
          onPointerMove={handleMove}
          onPointerLeave={handleLeave}
          style={
            {
              rotateX: isActive ? rotateX : 0,
              rotateY: isActive ? rotateY : 0,
              transformStyle: "preserve-3d",
              willChange: "transform",
              ...style,
            } as MotionStyle
          }
          whileHover={lift && isActive ? { translateZ: 18 } : undefined}
          transition={{ type: "spring", damping: 18, stiffness: 200 }}
          className="h-full"
          {...(rest as any)}
        >
          {children}
        </motion.div>
      </div>
    );
  }
);
TiltCard.displayName = "TiltCard";
