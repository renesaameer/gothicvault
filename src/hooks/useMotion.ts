import { useCallback } from "react";

const noop = () => {};

export function useStaggerIn<T extends HTMLElement = HTMLDivElement>(
  animClass: "stagger-grid" | "stagger-list" = "stagger-grid"
) {
  const ref = useCallback((_: T | null) => {
    noop();
  }, []);

  return { ref, className: animClass };
}

export function useFadeIn<T extends HTMLElement = HTMLDivElement>(
  animation: "fade-up" | "fade-in-scale" | "slide-in-left" | "slide-in-right" = "fade-up"
) {
  const ref = useCallback((_: T | null) => {
    noop();
  }, []);

  return { ref, className: animation };
}
