import { useState } from "react";
import { XIcon } from "@/components/ui/icons";
import { useLayoutData } from "./LayoutDataProvider";

const DISMISS_KEY = "announcement_dismissed";
const BAR_HEIGHT_CLASS = "h-8 sm:h-9";

const getDismissedState = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
};

const setDismissedState = () => {
  try {
    window.sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {}
};

const HAS_BAR_HINT_KEY = "announcement_bar_hint";

const getHadBarHint = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(HAS_BAR_HINT_KEY) === "1";
  } catch {
    return false;
  }
};

const AnnouncementBar = () => {
  const { announcement, loaded } = useLayoutData();
  const [dismissed, setDismissed] = useState(getDismissedState);

  // Only reserve space if a previous load showed a bar (hint cached in session).
  if (!loaded) {
    return getHadBarHint() ? <div className={BAR_HEIGHT_CLASS} aria-hidden="true" /> : null;
  }

  if (!announcement || dismissed || !announcement.enabled || !announcement.text) {
    try { window.sessionStorage.removeItem(HAS_BAR_HINT_KEY); } catch {}
    return null;
  }

  try { window.sessionStorage.setItem(HAS_BAR_HINT_KEY, "1"); } catch {}

  const handleDismiss = () => {
    setDismissed(true);
    setDismissedState();
  };

  const segment = (
    <span className="text-[10.5px] sm:text-[11px] font-medium tracking-[0.22em] uppercase mx-10 whitespace-nowrap inline-block">
      {announcement.text}
    </span>
  );

  // 12 copies ensures the track is wider than any reasonable viewport, so the
  // -50% translate loop yields a perfectly continuous, seamless scroll.
  const segments = Array.from({ length: 12 }, (_, i) => (
    <span key={i}>{segment}</span>
  ));

  const Track = (
    <div className="flex announcement-marquee">
      <div className="flex shrink-0">{segments}</div>
      <div className="flex shrink-0" aria-hidden="true">{segments}</div>
    </div>
  );

  return (
    <div
      className={`relative flex ${BAR_HEIGHT_CLASS} items-center overflow-hidden border-b border-black/[0.06]`}
      style={{ backgroundColor: announcement.bg_color, color: announcement.text_color }}
    >
      {/* Soft top sheen for premium depth */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
      {announcement.link ? (
        <a href={announcement.link} className="block w-full hover:opacity-90 transition-opacity duration-300">
          {Track}
        </a>
      ) : (
        Track
      )}
      {announcement.dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute right-2 sm:right-3 p-1 rounded-full hover:bg-white/10 transition-colors duration-200 z-10 opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          <XIcon size={12} />
        </button>
      )}
    </div>
  );
};

export default AnnouncementBar;
