import { useState, useEffect, useMemo } from "react";
import { useLayoutData } from "./LayoutDataProvider";
import { getPresetByKey, getReadableColor } from "@/lib/floatingIconPresets";

const DefaultExpandIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const RADAR_DURATION: Record<string, string> = { low: "2.6s", med: "2s", high: "1.6s" };
const BOUNCE_DURATION: Record<string, string> = { low: "2s", med: "1.4s", high: "1s" };

const radarStyle = (bg: string, intensity: string, delay = "0s"): React.CSSProperties => ({
  backgroundColor: `${bg}66`,
  animation: `${intensity === "low" ? "radar-low" : intensity === "high" ? "radar-high" : "radar"} ${RADAR_DURATION[intensity] || "2s"} cubic-bezier(0,0,0.2,1) infinite`,
  animationDelay: delay,
});

const bounceStyle = (intensity: string): React.CSSProperties => ({
  animation: `bounce-subtle-${intensity === "low" ? "low" : intensity === "high" ? "high" : "med"} ${BOUNCE_DURATION[intensity] || "1.4s"} ease-in-out infinite`,
});

interface IconCircleProps {
  bg: string;
  iconColor: string;
  iconUrl?: string | null;
  presetKey?: string | null;
  label: string;
  size?: "lg" | "md";
}

const IconCircle = ({ bg, iconColor, iconUrl, presetKey, label, size = "lg" }: IconCircleProps) => {
  const preset = getPresetByKey(presetKey);
  const dim = size === "lg" ? "w-7 h-7" : "w-6 h-6";
  if (preset) {
    return (
      <svg viewBox="0 0 24 24" className={`${dim} relative z-10`} style={{ color: iconColor }} dangerouslySetInnerHTML={{ __html: preset.svg }} aria-hidden="true" />
    );
  }
  if (iconUrl) {
    return <img src={iconUrl} alt="" className={`${dim} object-contain relative z-10`} />;
  }
  return <span className="relative z-10 text-sm font-bold uppercase" style={{ color: iconColor }}>{label?.[0] || "?"}</span>;
};

const FloatingIcons = () => {
  const { loaded, floatingIcons, floatingSettings } = useLayoutData();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const icons = useMemo(() => (floatingIcons || []).filter((i: any) => i.enabled && i.url), [floatingIcons]);

  if (!loaded) return null;
  if (icons.length === 0) return null;
  if (floatingSettings && floatingSettings.enabled === false) return null;

  const animStyle: string = (floatingSettings as any)?.animation_style ?? (floatingSettings?.radar_animation === false ? "none" : "radar");
  const intensity: string = (floatingSettings as any)?.animation_intensity ?? "med";
  const expandIconUrl = floatingSettings?.expand_icon_url || "";

  // Single icon — no expand
  if (icons.length === 1) {
    const icon: any = icons[0];
    const iconColor = icon.icon_color || getReadableColor(icon.bg_color || "#25D366");
    return (
      <a
        href={icon.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={icon.label}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        style={{ backgroundColor: icon.bg_color || "#25D366", ...(animStyle === "bounce" ? bounceStyle(intensity) : {}) }}
      >
        {animStyle === "radar" && (
          <>
            <span className="absolute inset-0 rounded-full" style={radarStyle(icon.bg_color || "#25D366", intensity)} />
            <span className="absolute inset-0 rounded-full" style={radarStyle(icon.bg_color || "#25D366", intensity, "0.6s")} />
          </>
        )}
        <IconCircle bg={icon.bg_color} iconColor={iconColor} iconUrl={icon.icon_url} presetKey={icon.preset_key} label={icon.label} />
      </a>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3.5">
      {expanded && (
        <div className="flex flex-col items-center gap-3.5 mb-1">
          {icons.map((icon: any, i: number) => {
            const iconColor = icon.icon_color || getReadableColor(icon.bg_color || "#25D366");
            return (
              <a
                key={icon.id}
                href={icon.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={icon.label}
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                style={{
                  backgroundColor: icon.bg_color || "#25D366",
                  animation: `floatItemIn 0.2s cubic-bezier(0.25,1,0.5,1) both`,
                  animationDelay: `${i * 35}ms`,
                }}
              >
                <IconCircle bg={icon.bg_color} iconColor={iconColor} iconUrl={icon.icon_url} presetKey={icon.preset_key} label={icon.label} size="md" />
              </a>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        aria-label={expanded ? "Close contact options" : "Open contact options"}
        aria-expanded={expanded}
        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg bg-primary text-primary-foreground active:scale-95 transition-transform"
        style={!expanded && animStyle === "bounce" ? bounceStyle(intensity) : undefined}
      >
        {!expanded && animStyle === "radar" && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary/40" style={{ animation: `${intensity === "low" ? "radar-low" : intensity === "high" ? "radar-high" : "radar"} ${RADAR_DURATION[intensity] || "2s"} cubic-bezier(0,0,0.2,1) infinite` }} />
            <span className="absolute inset-0 rounded-full bg-primary/40" style={{ animation: `${intensity === "low" ? "radar-low" : intensity === "high" ? "radar-high" : "radar"} ${RADAR_DURATION[intensity] || "2s"} cubic-bezier(0,0,0.2,1) infinite`, animationDelay: "0.6s" }} />
          </>
        )}
        <span className="relative z-10 flex items-center justify-center">
          {expanded ? (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : expandIconUrl ? (
            <img src={expandIconUrl} alt="" className="w-7 h-7 object-contain" />
          ) : (
            <DefaultExpandIcon />
          )}
        </span>
      </button>
    </div>
  );
};

export default FloatingIcons;
