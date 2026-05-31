import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";

interface Props {
  images: string[];
  selected: number;
  onSelect: (i: number) => void;
  /** matches main image height */
  heightClass?: string;
}

/**
 * Premium vertical thumbnail rail with:
 * - subtle internal scroll (hidden scrollbar)
 * - top/bottom fade hint so the next thumb is partially visible
 * - floating up/down arrows shown only when overflowing
 * - mouse wheel scrolls within the rail
 */
export default function VerticalThumbRail({ images, selected, onSelect, heightClass = "lg:h-[min(60vh,520px)]" }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canUp, setCanUp] = useState(false);
  const [canDown, setCanDown] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanUp(scrollTop > 2);
    setCanDown(scrollTop + clientHeight < scrollHeight - 2);
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

  // Ensure active thumb is visible
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const child = el.children[selected] as HTMLElement | undefined;
    if (!child) return;
    const top = child.offsetTop;
    const bottom = top + child.offsetHeight;
    if (top < el.scrollTop) el.scrollTo({ top: top - 8, behavior: "smooth" });
    else if (bottom > el.scrollTop + el.clientHeight)
      el.scrollTo({ top: bottom - el.clientHeight + 8, behavior: "smooth" });
  }, [selected]);

  const nudge = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ top: dir * 96, behavior: "smooth" });
  };

  return (
    <div className={`relative ${heightClass}`}>
      {/* Up arrow */}
      <button
        type="button"
        aria-label="Scroll thumbnails up"
        onClick={() => nudge(-1)}
        className={`absolute left-1/2 -translate-x-1/2 top-0 z-20 h-6 w-6 rounded-full bg-background/85 backdrop-blur border border-border/50 shadow-sm flex items-center justify-center text-foreground/70 hover:text-primary hover:bg-background transition-all duration-200 ${canUp ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <ChevronDownIcon size={14} className="rotate-180" />
      </button>

      {/* Top fade hint */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-8 z-10 bg-gradient-to-b from-background to-transparent transition-opacity duration-200 ${canUp ? "opacity-100" : "opacity-0"}`}
      />

      <div
        ref={scrollRef}
        className="h-full overflow-y-auto scrollbar-hide flex flex-col gap-2 pr-1"
      >
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`View image ${i + 1}`}
            aria-current={i === selected}
            className={`group w-[68px] h-[84px] rounded-[14px] overflow-hidden border transition-all duration-200 flex-shrink-0 bg-background ${
              i === selected
                ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.24)]"
                : "border-border/40 hover:border-primary/40"
            }`}
          >
            <img
              src={img}
              alt=""
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              loading="lazy"
              decoding="async"
              width={80}
              height={100}
            />
          </button>
        ))}
      </div>

      {/* Bottom fade hint */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-10 z-10 bg-gradient-to-t from-background to-transparent transition-opacity duration-200 ${canDown ? "opacity-100" : "opacity-0"}`}
      />

      {/* Down arrow */}
      <button
        type="button"
        aria-label="Scroll thumbnails down"
        onClick={() => nudge(1)}
        className={`absolute left-1/2 -translate-x-1/2 bottom-0 z-20 h-6 w-6 rounded-full bg-background/85 backdrop-blur border border-border/50 shadow-sm flex items-center justify-center text-foreground/70 hover:text-primary hover:bg-background transition-all duration-200 ${canDown ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <ChevronDownIcon size={14} />
      </button>
    </div>
  );
}