import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, Volume2, VolumeX, Play, Pause, Maximize2 } from "lucide-react";
import { parseVideoUrl, buildEmbedUrl, type VideoSource } from "@/lib/videoUrl";

export interface VideoReel {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  title: string | null;
  subtitle: string | null;
  product_id: string | null;
  cta_text: string | null;
  cta_enabled: boolean;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  product?: { id: string; name: string; slug: string; price: number; sale_price: number | null; image?: string | null } | null;
}

interface Props {
  reels: VideoReel[];
  sectionTitle?: string;
  subtitle?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   Premium video reels — horizontal snap carousel with cinematic modal.
   Supports YouTube, Vimeo, and direct video URLs.
   Cards center when few; scroll when many.
   ────────────────────────────────────────────────────────────────────── */
const VideoReels: React.FC<Props> = ({ reels, sectionTitle, subtitle }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef(0);
  const halfRef = useRef(0);
  const dragState = useRef<{ startX: number; startOffset: number; moved: boolean } | null>(null);

  if (!reels.length) return null;

  // Duplicate the track so the marquee loops seamlessly.
  const enableAuto = reels.length >= 3;
  const trackReels = enableAuto ? [...reels, ...reels] : reels;

  const applyOffset = (v: number) => {
    const track = trackRef.current;
    if (!track) return;
    offsetRef.current = v;
    track.style.transform = `translate3d(${-v}px, 0, 0)`;
  };

  // Keep halfWidth in sync with layout.
  useEffect(() => {
    if (!enableAuto) return;
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      halfRef.current = track.scrollWidth / 2;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [enableAuto, reels.length]);

  // Smooth transform-based marquee — pauses on hover, drag, or while a video plays.
  useEffect(() => {
    if (!enableAuto) return;
    let raf = 0;
    let last = performance.now();
    const SPEED = 32; // px/sec

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const half = halfRef.current;
      if (half > 0 && !hovered && !dragging && playingId === null) {
        let next = offsetRef.current + SPEED * dt;
        if (next >= half) next -= half;
        applyOffset(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enableAuto, hovered, dragging, playingId]);

  const wrapOffset = (v: number) => {
    const half = halfRef.current;
    if (half <= 0) return v;
    let n = v % half;
    if (n < 0) n += half;
    return n;
  };

  const scrollByCard = (dir: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-reel-card]");
    const viewport = viewportRef.current;
    const step = card ? card.offsetWidth + 16 : (viewport?.clientWidth ?? 300) * 0.6;
    const target = wrapOffset(offsetRef.current + step * dir);
    track.style.transition = "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)";
    applyOffset(target);
    window.setTimeout(() => {
      if (trackRef.current) trackRef.current.style.transition = "";
    }, 520);
  };

  // Pointer drag (mouse + touch)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const track = trackRef.current;
    if (track) track.style.transition = "";
    dragState.current = { startX: e.clientX, startOffset: offsetRef.current, moved: false };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    if (Math.abs(dx) > 4) dragState.current.moved = true;
    applyOffset(wrapOffset(dragState.current.startOffset - dx));
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    // Defer clearing dragging until after a click would have fired.
    const wasMoved = dragState.current?.moved ?? false;
    setDragging(false);
    if (wasMoved) {
      // Keep moved flag for click-capture suppression
      window.setTimeout(() => { dragState.current = null; }, 0);
    } else {
      dragState.current = null;
    }
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragState.current?.moved) {
      e.stopPropagation();
      e.preventDefault();
      dragState.current = null;
    }
  };

  return (
    <section className="relative py-6 sm:py-8 contain-content">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-4 sm:mb-6 px-5 sm:px-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground mb-2">
            {sectionTitle || "Real Customer Experiences"}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">{subtitle}</p>
          )}
          <div className="premium-divider max-w-[60px] mx-auto mt-4" />
        </div>


        <div
          className="relative"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div
            ref={viewportRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClickCapture={onClickCapture}
            className="reels-viewport overflow-hidden select-none"
            style={{
              cursor: dragging ? "grabbing" : "grab",
              touchAction: "pan-y",
            }}
          >
            <div
              ref={trackRef}
              className="flex gap-3 sm:gap-4 py-2 will-change-transform"
              style={{ width: "max-content", transform: "translate3d(0,0,0)" }}
            >
              {trackReels.map((r, i) => (
                <ReelCard
                  key={`${r.id}-${i}`}
                  reel={r}
                  isPlaying={playingId === `${r.id}-${i}`}
                  onPlay={() => setPlayingId(`${r.id}-${i}`)}
                  onStop={() =>
                    setPlayingId((id) => (id === `${r.id}-${i}` ? null : id))
                  }
                  onOpen={() => setOpenIdx(i % reels.length)}
                />
              ))}
            </div>
          </div>

          {/* Minimal arrows — visible on all screens */}
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollByCard(-1)}
            className="flex absolute left-1.5 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-background/85 border border-border/40 items-center justify-center text-foreground/80 hover:text-foreground hover:bg-background transition shadow-[0_4px_18px_rgba(0,0,0,0.06)]"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollByCard(1)}
            className="flex absolute right-1.5 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-background/85 border border-border/40 items-center justify-center text-foreground/80 hover:text-foreground hover:bg-background transition shadow-[0_4px_18px_rgba(0,0,0,0.06)]"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {openIdx !== null && (
        <ReelModal
          reels={reels}
          startIdx={openIdx}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </section>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
const ReelCard: React.FC<{
  reel: VideoReel;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onOpen: () => void;
}> = ({ reel, isPlaying, onPlay, onStop, onOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [cardMuted, setCardMuted] = useState(true);

  const src = parseVideoUrl(reel.video_url);
  const poster =
    reel.thumbnail_url ||
    (src.kind === "youtube" ? src.thumbnail : null);

  // Intersection: pause when scrolled out of view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const vis = entry.isIntersecting && entry.intersectionRatio > 0.3;
        setVisible(vis);
        if (!vis && isPlaying) onStop();
      },
      { threshold: [0, 0.3, 0.6] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isPlaying, onStop]);

  // Sync direct <video> with play/mute state
  useEffect(() => {
    if (src.kind !== "direct") return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = cardMuted;
    if (isPlaying && visible) {
      v.play().catch(() => {
        v.muted = true;
        setCardMuted(true);
        v.play().catch(() => onStop());
      });
    } else {
      v.pause();
    }
  }, [isPlaying, visible, src.kind, cardMuted, onStop]);

  const isEmbed = src.kind === "youtube" || src.kind === "vimeo";
  const inlineEmbedUrl =
    isPlaying && visible && isEmbed
      ? buildEmbedUrl(src, { autoplay: true, muted: cardMuted, loop: reel.loop, controls: false })
      : null;

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCardMuted((m) => !m);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPlaying) {
      onStop();
    } else {
      onPlay();
      setCardMuted(false);
    }
  };

  const openModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpen();
  };

  return (
    <div
      ref={containerRef}
      data-reel-card
      className="shrink-0 w-[58vw] xs:w-[48vw] sm:w-[32vw] md:w-[24vw] lg:w-[18vw] xl:w-[15vw] max-w-[280px] flex flex-col gap-2"
    >
      <div className="group relative block w-full aspect-[9/16] rounded-2xl overflow-hidden bg-muted/50 ring-1 ring-black/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_44px_rgba(0,0,0,0.10)] transition-all duration-500 hover:-translate-y-1 will-change-transform">
        {/* Skeleton */}
        {!loaded && !failed && !poster && (
          <div className="absolute inset-0 bg-gradient-to-br from-muted/40 to-muted/70 animate-pulse" />
        )}

        {/* Poster */}
        {poster && (
          <img
            src={poster}
            alt={reel.title || "Customer video"}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Inline YouTube/Vimeo — only when user clicks play */}
        {inlineEmbedUrl && (
          <iframe
            src={inlineEmbedUrl}
            title={reel.title || "Video"}
            allow="autoplay; encrypted-media; picture-in-picture"
            loading="lazy"
            className="absolute inset-0 w-full h-full border-0 pointer-events-none"
          />
        )}

        {/* Direct video — only when user clicks play */}
        {src.kind === "direct" && isPlaying && visible && !failed && (
          <video
            ref={videoRef}
            src={src.src}
            poster={poster || undefined}
            loop={reel.loop}
            playsInline
            preload="metadata"
            onLoadedData={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Bottom gradient overlay */}
        {!inlineEmbedUrl && (
          <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
        )}

        {/* Title overlay */}
        {!inlineEmbedUrl && reel.title && (
          <div className="absolute inset-x-0 bottom-0 p-3 text-left pointer-events-none">
            <p className="text-[12.5px] font-semibold text-white leading-snug line-clamp-2 drop-shadow">
              {reel.title}
            </p>
            {reel.subtitle && (
              <p className="text-[11px] text-white/75 mt-0.5 line-clamp-1">{reel.subtitle}</p>
            )}
          </div>
        )}

        {/* Mute toggle — TOP RIGHT */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={cardMuted ? "Unmute" : "Mute"}
          className="absolute top-2 right-2 z-20 w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur border border-white/25 flex items-center justify-center text-white transition"
        >
          {cardMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>

        {/* Center control — Play (when stopped) or Fullscreen (when playing) */}
        {!isPlaying ? (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Play"
            className="absolute inset-0 z-10 flex items-center justify-center"
          >
            <span className="w-14 h-14 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur border border-white/30 flex items-center justify-center text-white transition hover:scale-110">
              <Play size={22} className="fill-white ml-[2px]" />
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={openModal}
            aria-label="Fullscreen"
            className="absolute inset-0 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition"
          >
            <span className="w-14 h-14 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur border border-white/30 flex items-center justify-center text-white transition hover:scale-110">
              <Maximize2 size={20} />
            </span>
          </button>
        )}

        {/* Pause control — small, top-left, only while playing */}
        {isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Pause"
            className="absolute top-2 left-2 z-20 w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur border border-white/25 flex items-center justify-center text-white transition"
          >
            <Pause size={14} />
          </button>
        )}
      </div>


      {/* Product card directly below — no modal needed to see it */}
      {reel.product && (
        <Link
          to={`/product/${reel.product.slug}`}
          className="flex items-center gap-2 p-2 rounded-xl bg-card/60 backdrop-blur border border-black/[0.06] hover:border-black/[0.12] transition-all hover:-translate-y-0.5"
        >
          {reel.product.image && (
            <img
              src={reel.product.image}
              alt={reel.product.name}
              loading="lazy"
              className="w-9 h-9 rounded-lg object-cover shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-semibold text-foreground line-clamp-1 leading-tight">
              {reel.product.name}
            </p>
            <p className="text-[10.5px] text-muted-foreground tabular-nums">
              ৳{(reel.product.sale_price ?? reel.product.price).toLocaleString()}
            </p>
          </div>
        </Link>
      )}
    </div>
  );
};


/* ──────────────────────────────────────────────────────────────────────── */
const ReelModal: React.FC<{
  reels: VideoReel[];
  startIdx: number;
  onClose: () => void;
}> = ({ reels, startIdx, onClose }) => {
  const [idx, setIdx] = useState(startIdx);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);

  const reel = reels[idx];
  const src: VideoSource = parseVideoUrl(reel.video_url);
  const isEmbed = src.kind === "youtube" || src.kind === "vimeo";

  const prev = useCallback(() => setIdx((i) => (i - 1 + reels.length) % reels.length), [reels.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % reels.length), [reels.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  useEffect(() => {
    if (src.kind !== "direct") return;
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    setPlaying(true);
    v.play().catch(() => {});
  }, [idx, src.kind]);

  const togglePlay = () => {
    if (src.kind !== "direct") return;
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
    touchStartX.current = null;
  };

  const embedUrl = isEmbed
    ? buildEmbedUrl(src, { autoplay: true, muted, loop: reel.loop, controls: true })
    : null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" />

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur flex items-center justify-center text-white transition"
      >
        <X size={18} />
      </button>

      {/* Arrows */}
      {reels.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous"
            className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur items-center justify-center text-white transition"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next"
            className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur items-center justify-center text-white transition"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Active reel — perfectly centered, sized by height so it always fits */}
      <div
        className="relative z-20 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative h-[min(85vh,760px)] aspect-[9/16] max-w-[92vw] rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)] bg-black animate-in zoom-in-95 duration-300">

          {isEmbed && embedUrl ? (
            <iframe
              key={reel.id + (muted ? "-m" : "-u")}
              src={embedUrl}
              title={reel.title || "Video"}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          ) : src.kind === "direct" ? (
            <video
              ref={videoRef}
              key={reel.id}
              src={src.src}
              poster={reel.thumbnail_url || undefined}
              muted={muted}
              loop={reel.loop}
              playsInline
              autoPlay
              onClick={togglePlay}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/70 text-sm p-6 text-center">
              Unsupported video URL.
            </div>
          )}

          {/* Controls (hidden on iframe — uses native controls) */}
          {src.kind === "direct" && (
            <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur border border-white/20 flex items-center justify-center text-white"
              >
                {playing ? <Pause size={14} /> : <Play size={14} className="ml-[1px]" />}
              </button>
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Unmute" : "Mute"}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur border border-white/20 flex items-center justify-center text-white"
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          )}
          {isEmbed && (
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute" : "Mute"}
              className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur border border-white/20 flex items-center justify-center text-white"
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          )}

          {/* Bottom gradient + product card (overlay only when not iframe to avoid blocking YT controls) */}
          {!isEmbed && (
            <>
              <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 p-4 z-10">
                {reel.title && (
                  <p className="text-[14px] font-semibold text-white leading-snug mb-2 line-clamp-2 drop-shadow">
                    {reel.title}
                  </p>
                )}
                {reel.product && (
                  <ProductCard reel={reel} onClose={onClose} />
                )}
              </div>
            </>
          )}
        </div>

        {/* Product card BELOW iframe so it doesn't block player controls */}
        {isEmbed && reel.product && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full w-[min(92vw,420px)] mt-3">
            <ProductCard reel={reel} onClose={onClose} />
          </div>
        )}

        {/* Mobile pager */}
        {reels.length > 1 && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 md:hidden flex gap-1.5 z-30">
            {reels.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

const ProductCard: React.FC<{ reel: VideoReel; onClose: () => void }> = ({ reel, onClose }) => {
  if (!reel.product) return null;
  return (
    <div className="flex items-center gap-3 bg-white/95 backdrop-blur rounded-2xl p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      {reel.product.image && (
        <img
          src={reel.product.image}
          alt={reel.product.name}
          className="w-12 h-12 rounded-xl object-cover shrink-0"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold text-foreground line-clamp-1">
          {reel.product.name}
        </p>
        <p className="text-[11px] text-muted-foreground">
          ৳{(reel.product.sale_price ?? reel.product.price).toLocaleString()}
        </p>
      </div>
      {reel.cta_enabled && (
        <Link
          to={`/product/${reel.product.slug}`}
          onClick={onClose}
          className="shrink-0 inline-flex items-center justify-center px-4 h-9 rounded-full bg-foreground text-background text-[11.5px] font-semibold hover:opacity-90 transition"
        >
          {reel.cta_text || "Shop Now"}
        </Link>
      )}
    </div>
  );
};

export default VideoReels;
