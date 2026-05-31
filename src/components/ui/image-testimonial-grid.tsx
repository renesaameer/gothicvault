import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface MasonryTestimonial {
  profileImage?: string | null;
  name: string;
  feedback: string;
  mainImage?: string | null;
  rating?: number;
}

interface MasonryGridProps extends React.HTMLAttributes<HTMLDivElement> {
  items: MasonryTestimonial[];
  columns?: number;
  gap?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const initials = (n: string) =>
  n
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const TestimonialMasonryCard: React.FC<MasonryTestimonial> = ({
  profileImage,
  name,
  feedback,
  mainImage,
}) => (
  <div className="group relative mb-4 overflow-hidden rounded-[24px] border border-border/40 bg-secondary/30 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_50px_-18px_hsl(var(--primary)/0.4)]">
    {mainImage ? (
      <img
        src={mainImage}
        alt={name}
        loading="lazy"
        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    ) : (
      <div className="w-full aspect-[3/4] bg-gradient-to-br from-secondary via-muted to-secondary" />
    )}

    {/* Gradient veil */}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

    {/* Caption */}
    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
      <div className="flex items-center gap-2.5 mb-2">
        {profileImage ? (
          <img
            src={profileImage}
            alt={name}
            loading="lazy"
            className="h-8 w-8 rounded-full object-cover ring-1 ring-white/30"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary/30 ring-1 ring-white/30 flex items-center justify-center text-[10px] font-medium text-white tracking-wide">
            {initials(name)}
          </div>
        )}
        <span className="text-xs font-medium text-white/95 tracking-wide truncate">{name}</span>
      </div>
      <p className="text-[13px] sm:text-sm text-white/85 leading-snug tracking-[-0.005em] line-clamp-3">
        {feedback}
      </p>
    </div>
  </div>
);

export const MasonryGrid = React.forwardRef<HTMLDivElement, MasonryGridProps>(
  ({ className, columns = 4, gap = 4, items, ...props }, ref) => {
    const style: React.CSSProperties = {
      columnCount: columns,
      columnGap: `${gap * 0.25}rem`,
    };

    return (
      <div ref={ref} className={cn("w-full", className)} style={style} {...props}>
        {items.map((item, i) => (
          <motion.div
            key={`${item.name}-${i}`}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            transition={{ delay: Math.min(i * 0.05, 0.3) }}
            className="break-inside-avoid"
          >
            <TestimonialMasonryCard {...item} />
          </motion.div>
        ))}
      </div>
    );
  }
);
MasonryGrid.displayName = "MasonryGrid";
