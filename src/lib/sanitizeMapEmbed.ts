import DOMPurify from "dompurify";

/**
 * Allow only Google Maps iframes inside the contact map embed slot.
 * Anything else (script tags, arbitrary iframes, event handlers) is stripped.
 */
export function sanitizeMapEmbed(html: string | null | undefined): string {
  if (!html || typeof html !== "string") return "";
  const cleaned = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["iframe"],
    ALLOWED_ATTR: ["src", "width", "height", "style", "allowfullscreen", "loading", "referrerpolicy", "title"],
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ADD_URI_SAFE_ATTR: ["src"],
  });
  // Final whitelist: src must point at google maps
  const m = cleaned.match(/src="([^"]+)"/i);
  if (!m) return "";
  try {
    const u = new URL(m[1]);
    const host = u.hostname.toLowerCase();
    if (!host.endsWith("google.com") || !u.pathname.startsWith("/maps")) return "";
  } catch {
    return "";
  }
  return cleaned;
}
