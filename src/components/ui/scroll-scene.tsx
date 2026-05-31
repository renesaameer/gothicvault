"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  type MotionStyle,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

const useReduced = () => {
  const [r, setR] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setR(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return r;
};

type Variant = "rise" | "zoom" | "tilt" | "cinematic" | "drift";

interface ScrollSceneProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  /** 0-1 multiplier, default 1 */
  intensity?: number;
  children: React.ReactNode;
}

/**
 * Cinematic scroll-driven scene wrapper.
 * - rise:      fade + slide up as it enters
 * - zoom:      scale from 0.88 → 1, opacity 0 → 1
 * - tilt:      perspective tilt as it crosses viewport
 * - cinematic: rise + slight zoom + perspective rotateX
 * - drift:     parallax X drift
 */
export const ScrollScene = React.forwardRef<HTMLDivElement, ScrollSceneProps>(
  ({ variant = "cinematic", intensity = 1, className, children, style, ...rest }, ref) => {
    const innerRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);
    const reduced = useReduced();

    const { scrollYProgress } = useScroll({
      target: innerRef,
      offset: ["start end", "end start"],
    });

    const k = reduced ? 0 : intensity;

    // common transforms
    const yRise = useTransform(scrollYProgress, [0, 0.5, 1], [80 * k, 0, -60 * k]);
    const opacityRise = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0.85]);
    const scaleZoom = useTransform(scrollYProgress, [0, 0.5, 1], [0.88 + 0.12 * (1 - k), 1, 1.04]);
    const opacityZoom = useTransform(scrollYProgress, [0, 0.35, 1], [0, 1, 1]);
    const rotateXTilt = useTransform(scrollYProgress, [0, 0.5, 1], [`${12 * k}deg`, "0deg", `${-8 * k}deg`]);
    const yCine = useTransform(scrollYProgress, [0, 0.5, 1], [120 * k, 0, -80 * k]);
    const scaleCine = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 1.02]);
    const rotateCine = useTransform(scrollYProgress, [0, 0.5, 1], [`${6 * k}deg`, "0deg", `${-4 * k}deg`]);
    const opacityCine = useTransform(scrollYProgress, [0, 0.25, 0.85, 1], [0, 1, 1, 0.7]);
    const xDrift = useTransform(scrollYProgress, [0, 1], [-60 * k, 60 * k]);

    let mStyle: MotionStyle = { transformStyle: "preserve-3d", willChange: "transform, opacity" };
    if (variant === "rise") mStyle = { ...mStyle, y: yRise, opacity: opacityRise };
    if (variant === "zoom") mStyle = { ...mStyle, scale: scaleZoom, opacity: opacityZoom };
    if (variant === "tilt") mStyle = { ...mStyle, rotateX: rotateXTilt, opacity: opacityZoom };
    if (variant === "cinematic")
      mStyle = { ...mStyle, y: yCine, scale: scaleCine, rotateX: rotateCine, opacity: opacityCine };
    if (variant === "drift") mStyle = { ...mStyle, x: xDrift, opacity: opacityRise };

    return (
      <div
        ref={innerRef}
        className={cn("relative [perspective:1600px]", className)}
        style={style}
        {...rest}
      >
        <motion.div style={mStyle} className="will-change-transform">
          {children}
        </motion.div>
      </div>
    );
  }
);
ScrollScene.displayName = "ScrollScene";

/**
 * Parallax image — translates Y as you scroll past.
 * Wrap with `overflow-hidden` parent.
 */
interface ParallaxImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  speed?: number; // -1 to 1, default 0.3
  scale?: number; // default 1.15
}
export const ParallaxImage = React.forwardRef<HTMLImageElement, ParallaxImageProps>(
  ({ speed = 0.3, scale = 1.15, className, style, ...rest }, ref) => {
    const wrapRef = React.useRef<HTMLDivElement>(null);
    const reduced = useReduced();
    const { scrollYProgress } = useScroll({
      target: wrapRef,
      offset: ["start end", "end start"],
    });
    const y = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : [`${-50 * speed}%`, `${50 * speed}%`]);

    return (
      <div ref={wrapRef} className="absolute inset-0 overflow-hidden">
        <motion.img
          ref={ref}
          style={{ y, scale: reduced ? 1 : scale, ...style }}
          className={cn("absolute inset-0 w-full h-full object-cover will-change-transform", className)}
          {...rest}
        />
      </div>
    );
  }
);
ParallaxImage.displayName = "ParallaxImage";

/**
 * Cinematic section that pins-ish and reveals on scroll.
 * Use as drop-in <section> replacement.
 */
export const CinematicSection = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { intensity?: number }
>(({ children, className, intensity = 1, ...rest }, ref) => {
  return (
    <section ref={ref} className={cn("relative", className)} {...rest}>
      <ScrollScene variant="cinematic" intensity={intensity}>{children}</ScrollScene>
    </section>
  );
});
CinematicSection.displayName = "CinematicSection";

/**
 * 3D mouse-tracked tilt with deeper perspective. Use for hero cards.
 */
export const DeepTilt: React.FC<React.HTMLAttributes<HTMLDivElement> & { intensity?: number }> = ({
  intensity = 14,
  children,
  className,
  ...rest
}) => {
  const reduced = useReduced();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 180, damping: 20 });
  const sy = useSpring(my, { stiffness: 180, damping: 20 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [`-${intensity}deg`, `${intensity}deg`]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [`${intensity}deg`, `-${intensity}deg`]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  return (
    <div className={cn("[perspective:1600px]", className)} {...rest}>
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX: reduced ? 0 : rotateX, rotateY: reduced ? 0 : rotateY, transformStyle: "preserve-3d", willChange: "transform" }}
      >
        {children}
      </motion.div>
    </div>
  );
};
