import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";

interface Props {
  images: string[];
  selected: number;
  onSelect: (i: number) => void;
}

/**
 * Premium horizontal thumbnail row:
 * - hidden scrollbar
 * - left/right floating arrows shown only when overflowing
 * - active thumb auto-scrolls into view
 */
export default function HorizontalThumbRow({ images, selected, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 2);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  useEffect(() => {
    update();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update, images.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const child = el.children[selected] as HTMLElement | undefined;
    if (!child) return;
    const left = child.offsetLeft;
    const right = left + child.offsetWidth;
    if (left < el.scrollLeft) el.scrollTo({ left: left - 8, behavior: "smooth" });
    else if (right > el.scrollLeft + el.clientWidth)
      el.scrollTo({ left: right - el.clientWidth + 8, behavior: "smooth" });
  }, [selected]);

  const nudge = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.6), behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Left arrow */}
      <button
        type="button"
        aria-label="Scroll thumbnails left"
        onClick={() => nudge(-1)}
        className={`absolute top-1/2 -translate-y-1/2 left-1 z-20 h-7 w-7 rounded-full bg-background/90 backdrop-blur border border-border/50 shadow-sm flex items-center justify-center text-foreground/70 hover:text-primary hover:bg-background transition-all duration-200 ${canLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <ChevronDownIcon size={14} className="rotate-90" />
      </button>

      {/* Left fade */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-8 z-10 bg-gradient-to-r from-background to-transparent transition-opacity duration-200 ${canLeft ? "opacity-100" : "opacity-0"}`}
      />

      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide flex gap-2.5 pb-1"
      >
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`View image ${i + 1}`}
            aria-current={i === selected}
            className={`group w-[72px] h-[88px] rounded-[14px] overflow-hidden border transition-all duration-200 flex-shrink-0 bg-background ${
              i === selected
                ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.28)]"
                : "border-border/40 hover:border-primary/40"
            }`}
          >
            <img
              src={img}
              alt=""
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
              width={80}
              height={100}
            />
          </button>
        ))}
      </div>

      {/* Right fade */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 z-10 bg-gradient-to-l from-background to-transparent transition-opacity duration-200 ${canRight ? "opacity-100" : "opacity-0"}`}
      />

      {/* Right arrow */}
      <button
        type="button"
        aria-label="Scroll thumbnails right"
        onClick={() => nudge(1)}
        className={`absolute top-1/2 -translate-y-1/2 right-1 z-20 h-7 w-7 rounded-full bg-background/90 backdrop-blur border border-border/50 shadow-sm flex items-center justify-center text-foreground/70 hover:text-primary hover:bg-background transition-all duration-200 ${canRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <ChevronDownIcon size={14} className="-rotate-90" />
      </button>
    </div>
  );
}
