"use client";
import React from "react";
import { motion } from "motion/react";

export type TestimonialItem = {
  text: string;
  image?: string;
  name: string;
  role?: string;
};

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration ?? 12,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-5 pb-5 bg-background"
      >
        {[0, 1].map((dup) => (
          <React.Fragment key={dup}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <div
                key={`${dup}-${i}`}
                className="p-6 rounded-2xl glass-card max-w-xs w-full"
              >
                <div className="text-[13px] text-foreground/80 leading-relaxed italic">
                  "{text}"
                </div>
                <div className="premium-divider my-4" />
                <div className="flex items-center gap-3">
                  {image && (
                    <img
                      width={36}
                      height={36}
                      src={image}
                      alt={name}
                      loading="lazy"
                      decoding="async"
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/20"
                    />
                  )}
                  <div className="flex flex-col">
                    <div className="font-medium tracking-tight leading-5 text-foreground text-[13px]">
                      {name}
                    </div>
                    {role && (
                      <div className="leading-5 text-muted-foreground tracking-tight text-[11.5px]">
                        {role}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};
