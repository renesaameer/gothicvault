import { useEffect } from "react";

const setMeta = (selector: string, attr: string, value: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const [, name] = selector.match(/\[(?:name|property)="([^"]+)"\]/) ?? [];
    if (selector.includes("property=")) el.setAttribute("property", name ?? "");
    else el.setAttribute("name", name ?? "");
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

const setLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

export interface DocumentMetaOptions {
  title: string;
  description?: string;
  canonicalPath?: string;
}

/**
 * Lightweight per-page meta updater (no react-helmet dep).
 * Call once at the top of a page component with stable strings.
 */
export function useDocumentMeta({ title, description, canonicalPath }: DocumentMetaOptions) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    if (description) {
      setMeta('meta[name="description"]', "content", description);
      setMeta('meta[property="og:description"]', "content", description);
      setMeta('meta[name="twitter:description"]', "content", description);
    }
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[name="twitter:title"]', "content", title);
    if (canonicalPath) {
      const url = `${window.location.origin}${canonicalPath}`;
      setLink("canonical", url);
      setMeta('meta[property="og:url"]', "content", url);
    }
    return () => {
      document.title = previousTitle;
    };
  }, [title, description, canonicalPath]);
}

/** Inject (or replace) a JSON-LD <script> tag identified by a stable id. */
export function useJsonLd(id: string, data: unknown | null) {
  useEffect(() => {
    const existing = document.getElementById(id);
    if (!data) {
      if (existing) existing.remove();
      return;
    }
    const json = JSON.stringify(data);
    if (existing) {
      existing.textContent = json;
      return;
    }
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = json;
    document.head.appendChild(script);
    return () => {
      const node = document.getElementById(id);
      if (node) node.remove();
    };
  }, [id, data]);
}
