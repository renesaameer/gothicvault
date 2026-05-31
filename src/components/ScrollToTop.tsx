import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const ScrollToTop = () => {
  const { pathname } = useLocation();

  // Use layoutEffect to scroll before paint — ensures page opens at top
  useIsomorphicLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
