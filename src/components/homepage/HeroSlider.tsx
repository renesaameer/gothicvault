import { useState, useEffect, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValue, useSpring, type MotionStyle } from "motion/react";

export interface HeroSlide {
  id: string;
  sort_order: number | null;
  enabled: boolean | null;
  image_url: string;
  mobile_image_url?: string | null;
  video_url?: string | null;
  label?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
  cta2_text?: string | null;
  cta2_link?: string | null;
  text_color?: string | null;
  text_align?: "left" | "center" | "right" | null;
  vertical_position?: "top" | "middle" | "bottom" | null;
  height?: "sm" | "md" | "lg" | "full" | null;
  overlay_opacity?: number | null;
  focal_x?: number | null;
  focal_y?: number | null;
  // Legacy compat:
  title?: string | null;
  subtitle?: string | null;
  button_text?: string | null;
  button_link?: string | null;
}

interface FallbackHero {
  image?: string | null;
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_link?: string;
}

const heightClass = (h?: string | null) => {
  switch (h) {
    case "sm": return "h-[calc(70svh-92px)] sm:h-[calc(70svh-96px)] min-h-[420px]";
    case "md": return "h-[calc(85svh-92px)] sm:h-[calc(85svh-96px)] min-h-[480px]";
    case "lg": return "h-[calc(95svh-92px)] sm:h-[calc(95svh-96px)] min-h-[520px]";
    case "full":
    default: return "h-[calc(100svh-92px)] sm:h-[calc(100svh-96px)] min-h-[520px]";
  }
};

const useReducedMotion = () => {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setR(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return r;
};

const Media = ({ slide, priority, useMobile, parallaxY, parallaxScale }: { slide: HeroSlide; priority: boolean; useMobile: boolean; parallaxY: any; parallaxScale: any; }) => {
  const focalX = slide.focal_x ?? 50;
  const focalY = slide.focal_y ?? 50;
  const objPos = `${focalX}% ${focalY}%`;
  const src = (useMobile && slide.mobile_image_url) || slide.image_url;

  if (slide.video_url) {
    return (
      <motion.video
        src={slide.video_url}
        autoPlay
        muted
        loop
        playsInline
        poster={src || undefined}
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
        style={{ objectPosition: objPos, y: parallaxY, scale: parallaxScale }}
      />
    );
  }
  return (
    <motion.img
      src={src}
      alt={slide.headline || slide.title || "Hero"}
      className="absolute inset-0 w-full h-full object-cover will-change-transform"
      style={{ objectPosition: objPos, y: parallaxY, scale: parallaxScale }}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      width={1920}
      height={1080}
      {...(priority ? { fetchpriority: "high" as const } : {})}
    />
  );
};

const SlideContent = ({ slide, priority, useMobile }: { slide: HeroSlide; priority: boolean; useMobile: boolean }) => {
  const label = slide.label;
  const headline = slide.headline ?? slide.title;
  const sub = slide.subheadline ?? slide.subtitle;
  const cta1Text = slide.cta_text ?? slide.button_text;
  const cta1Link = slide.cta_link ?? slide.button_link;
  const cta2Text = slide.cta2_text;
  const cta2Link = slide.cta2_link;
  const textColor = slide.text_color || "#ffffff";
  const overlay = Math.max(0, Math.min(1, slide.overlay_opacity ?? 0.35));

  const sectionRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Scroll parallax
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const rawY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, 180]);
  const rawScale = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [1.08, 1.22]);
  const contentY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, -80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const parallaxY = useSpring(rawY, { stiffness: 80, damping: 22, mass: 0.4 });
  const parallaxScale = useSpring(rawScale, { stiffness: 80, damping: 22, mass: 0.4 });

  // Mouse 3D tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 120, damping: 18, mass: 0.5 });
  const rotateY = useTransform(sx, [-0.5, 0.5], reduced ? ["0deg", "0deg"] : ["-4deg", "4deg"]);
  const rotateX = useTransform(sy, [-0.5, 0.5], reduced ? ["0deg", "0deg"] : ["3deg", "-3deg"]);
  const tiltMediaX = useTransform(sx, [-0.5, 0.5], reduced ? [0, 0] : [-18, 18]);
  const tiltMediaY = useTransform(sy, [-0.5, 0.5], reduced ? [0, 0] : [-12, 12]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  return (
    <div
      ref={sectionRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="absolute inset-0 overflow-hidden [perspective:1400px]"
    >
      {/* Parallax media layer with subtle mouse drift */}
      <motion.div
        className="absolute inset-0"
        style={{ x: tiltMediaX, y: tiltMediaY, transformStyle: "preserve-3d" } as MotionStyle}
      >
        <Media slide={slide} priority={priority} useMobile={useMobile} parallaxY={parallaxY} parallaxScale={parallaxScale} />
      </motion.div>

      {/* gradient + flat overlay for legibility */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/55 via-black/15 to-black/20" />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />

      {/* Ambient glow that follows cursor */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-60 mix-blend-screen"
        style={{
          background: useTransform([sx, sy], ([x, y]: any) =>
            `radial-gradient(600px circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.18), transparent 60%)`
          ),
        }}
      />

      {/* content with 3D tilt + scroll fade */}
      <motion.div
        className="relative z-[1] h-full flex items-center justify-center"
        style={{ rotateX, rotateY, y: contentY, opacity: contentOpacity, transformStyle: "preserve-3d" } as MotionStyle}
      >
        <div className="w-full px-6 sm:px-10 lg:px-14 flex justify-center" style={{ transformStyle: "preserve-3d" }}>
          <div
            className="flex flex-col items-center text-center gap-3 sm:gap-4 max-w-2xl mx-auto"
            style={{ color: textColor, transform: "translateZ(40px)" }}
          >
            {label && (
              <motion.span
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 0.9, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
                className="text-[11px] sm:text-[12px] font-semibold tracking-[0.28em] uppercase"
                style={{ transform: "translateZ(20px)" }}
              >
                {label}
              </motion.span>
            )}
            {headline && (
              <motion.h1
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="font-display font-bold uppercase leading-[1.05] tracking-tight text-[32px] sm:text-[48px] lg:text-[64px] xl:text-[76px]"
                style={{ fontFamily: '"Archivo Black", system-ui, sans-serif', transform: "translateZ(60px)", textShadow: "0 8px 40px rgba(0,0,0,0.35)" }}
              >
                {headline}
              </motion.h1>
            )}
            {sub && (
              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 0.85, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }}
                className="text-[14px] sm:text-[16px] lg:text-[17px] max-w-xl leading-relaxed mx-auto"
                style={{ transform: "translateZ(30px)" }}
              >
                {sub}
              </motion.p>
            )}
            {(cta1Text || cta2Text) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
                className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
                style={{ transform: "translateZ(50px)" }}
              >
                {cta1Text && cta1Link && (
                  <Link
                    to={cta1Link}
                    className="inline-flex items-center justify-center px-7 sm:px-9 py-3 sm:py-3.5 bg-white text-black text-[12px] sm:text-[14px] font-semibold tracking-[0.14em] uppercase rounded-sm hover:bg-white/90 active:scale-[0.97] transition-all duration-150 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
                  >
                    {cta1Text}
                  </Link>
                )}
                {cta2Text && cta2Link && (
                  <Link
                    to={cta2Link}
                    className="inline-flex items-center justify-center px-7 sm:px-9 py-3 sm:py-3.5 border border-white/70 text-white text-[12px] sm:text-[14px] font-semibold tracking-[0.14em] uppercase rounded-sm hover:bg-white/10 active:scale-[0.97] transition-all duration-150 backdrop-blur-sm"
                  >
                    {cta2Text}
                  </Link>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        aria-hidden
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2] flex flex-col items-center gap-2 pointer-events-none"
        style={{ opacity: contentOpacity }}
      >
        <span className="text-[9px] uppercase tracking-[0.32em] text-white/70">Scroll</span>
        <motion.div
          className="w-px h-8 bg-gradient-to-b from-white/70 to-transparent"
          animate={{ scaleY: [0.4, 1, 0.4], originY: 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
};

const useIsMobile = () => {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return m;
};

const HeroCarousel = ({ slides, autoplay, autoplaySpeed }: { slides: HeroSlide[]; autoplay: boolean; autoplaySpeed: number }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 35 });
  const [activeIndex, setActiveIndex] = useState(0);
  const isMobile = useIsMobile();
  const hoverRef = useRef(false);

  const onSelect = useCallback(() => {
    if (emblaApi) setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || !autoplay || slides.length <= 1) return;
    const interval = window.setInterval(() => {
      if (!hoverRef.current) emblaApi.scrollNext();
    }, Math.max(2000, autoplaySpeed));
    return () => window.clearInterval(interval);
  }, [emblaApi, autoplay, autoplaySpeed, slides.length]);

  const heightCls = heightClass(slides[activeIndex]?.height);

  return (
    <section
      className={`relative w-full ${heightCls} overflow-hidden bg-black`}
      onMouseEnter={() => { hoverRef.current = true; }}
      onMouseLeave={() => { hoverRef.current = false; }}
    >
      <div className="embla absolute inset-0" ref={emblaRef}>
        <div className="embla__container flex h-full">
          {slides.map((slide, index) => (
            <div className="embla__slide flex-[0_0_100%] min-w-0 relative h-full" key={slide.id}>
              <SlideContent slide={slide} priority={index === 0} useMobile={isMobile} />
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`h-[2px] rounded-full transition-all duration-300 ${index === activeIndex ? "bg-white w-8" : "bg-white/40 w-4"}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

interface HeroSliderProps {
  fallbackHero: FallbackHero;
  slides: HeroSlide[];
  loading: boolean;
  autoplay?: boolean;
  autoplaySpeed?: number;
}

const HeroSlider = ({ fallbackHero, slides, loading, autoplay = true, autoplaySpeed = 6000 }: HeroSliderProps) => {
  const isMobile = useIsMobile();
  const activeSlides = slides.filter((s) => s.enabled !== false);

  if (loading || activeSlides.length === 0) {
    const fb: HeroSlide = {
      id: "__fallback__",
      sort_order: 0,
      enabled: true,
      image_url: fallbackHero.image || "",
      headline: fallbackHero.title,
      subheadline: fallbackHero.subtitle,
      cta_text: fallbackHero.button_text,
      cta_link: fallbackHero.button_link,
      height: "full",
      vertical_position: "bottom",
      text_align: "left",
      overlay_opacity: 0.35,
      text_color: "#ffffff",
      focal_x: 50,
      focal_y: 50,
    };
    return (
      <section className={`relative w-full ${heightClass(fb.height)} overflow-hidden bg-black`}>
        <SlideContent slide={fb} priority useMobile={isMobile} />
      </section>
    );
  }

  if (activeSlides.length === 1) {
    const s = activeSlides[0];
    return (
      <section className={`relative w-full ${heightClass(s.height)} overflow-hidden bg-black`}>
        <SlideContent slide={s} priority useMobile={isMobile} />
      </section>
    );
  }

  return <HeroCarousel slides={activeSlides} autoplay={autoplay} autoplaySpeed={autoplaySpeed} />;
};

export default HeroSlider;
