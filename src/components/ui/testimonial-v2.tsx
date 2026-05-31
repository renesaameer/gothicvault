import { motion } from "motion/react";
import type { Testimonial as DbTestimonial } from "@/types/database";

export interface TestimonialItem {
  text: string;
  image?: string;
  name: string;
  role?: string;
}

interface ColumnProps {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}

const TestimonialsColumn = ({ className = "", testimonials, duration = 18 }: ColumnProps) => {
  if (!testimonials.length) return null;
  return (
    <div className={className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{ duration, repeat: Infinity, ease: "linear", repeatType: "loop" }}
        className="flex flex-col gap-5 pb-5 bg-background"
      >
        {[...Array(2)].map((_, dup) => (
          <div key={dup} className="flex flex-col gap-5">
            {testimonials.map(({ text, image, name, role }, i) => (
              <div
                key={`${dup}-${i}`}
                className="p-6 sm:p-7 rounded-3xl glass-card max-w-xs w-full"
              >
                <p className="text-[13.5px] sm:text-sm text-foreground/85 leading-relaxed">
                  "{text}"
                </p>
                <div className="flex items-center gap-3 mt-5">
                  {image ? (
                    <img
                      src={image}
                      alt={name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-[13px] font-semibold text-foreground">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="leading-tight">
                    <div className="text-[13.5px] font-semibold tracking-tight text-foreground">{name}</div>
                    {role && (
                      <div className="text-[12px] text-muted-foreground mt-0.5">{role}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

interface TestimonialsSectionProps {
  testimonials: TestimonialItem[];
  badge?: string;
  title?: string;
  subtitle?: string;
}

const TestimonialsSection = ({
  testimonials,
  badge = "Testimonials",
  title = "What our customers say",
  subtitle = "Real stories from people who carry AEROM every day.",
}: TestimonialsSectionProps) => {
  if (!testimonials.length) return null;

  // Split into up to 3 columns
  const size = Math.ceil(testimonials.length / 3) || 1;
  const firstColumn = testimonials.slice(0, size);
  const secondColumn = testimonials.slice(size, size * 2).length
    ? testimonials.slice(size, size * 2)
    : firstColumn;
  const thirdColumn = testimonials.slice(size * 2).length
    ? testimonials.slice(size * 2)
    : firstColumn;

  return (
    <section className="py-8 sm:py-10 lg:py-14 section-padding contain-content">
      <div className="container mx-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto text-center"
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] glass-card">
            {badge}
          </div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground mt-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md">
              {subtitle}
            </p>
          )}
          <div className="premium-divider max-w-[60px] mx-auto mt-4" />
        </motion.div>

        <div className="flex justify-center gap-5 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)] max-h-[640px] sm:max-h-[720px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={20} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={26} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={22} />
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

// Helper to convert DB rows
export const fromDbTestimonials = (rows: DbTestimonial[]): TestimonialItem[] =>
  rows.map((t) => ({
    text: t.review,
    image: t.image_url ?? undefined,
    name: t.name,
    role: undefined,
  }));
