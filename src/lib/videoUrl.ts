// Parse any video URL into a normalized descriptor.
// Supports YouTube, Vimeo, and direct video files (mp4/webm/mov/m3u8).

export type VideoSource =
  | { kind: "youtube"; id: string; embed: string; thumbnail: string }
  | { kind: "vimeo"; id: string; embed: string; thumbnail: string | null }
  | { kind: "direct"; src: string }
  | { kind: "invalid" };

const YT_REGEX =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/i;

const VIMEO_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/i;

export function parseVideoUrl(url: string | null | undefined): VideoSource {
  const u = (url || "").trim();
  if (!u) return { kind: "invalid" };

  // YouTube
  const yt = u.match(YT_REGEX);
  if (yt) {
    const id = yt[1];
    return {
      kind: "youtube",
      id,
      embed: `https://www.youtube.com/embed/${id}`,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  // Vimeo
  const vm = u.match(VIMEO_REGEX);
  if (vm) {
    const id = vm[1];
    return {
      kind: "vimeo",
      id,
      embed: `https://player.vimeo.com/video/${id}`,
      thumbnail: null,
    };
  }

  // Direct video file
  if (/^https?:\/\//i.test(u)) {
    return { kind: "direct", src: u };
  }

  return { kind: "invalid" };
}

export function buildEmbedUrl(
  src: VideoSource,
  opts: { autoplay?: boolean; muted?: boolean; loop?: boolean; controls?: boolean } = {}
): string | null {
  const { autoplay = true, muted = true, loop = true, controls = false } = opts;
  if (src.kind === "youtube") {
    const params = new URLSearchParams({
      autoplay: autoplay ? "1" : "0",
      mute: muted ? "1" : "0",
      loop: loop ? "1" : "0",
      controls: controls ? "1" : "0",
      modestbranding: "1",
      rel: "0",
      playsinline: "1",
      ...(loop ? { playlist: src.id } : {}),
    });
    return `${src.embed}?${params.toString()}`;
  }
  if (src.kind === "vimeo") {
    const params = new URLSearchParams({
      autoplay: autoplay ? "1" : "0",
      muted: muted ? "1" : "0",
      loop: loop ? "1" : "0",
      controls: controls ? "1" : "0",
      title: "0",
      byline: "0",
      portrait: "0",
      playsinline: "1",
    });
    return `${src.embed}?${params.toString()}`;
  }
  return null;
}
