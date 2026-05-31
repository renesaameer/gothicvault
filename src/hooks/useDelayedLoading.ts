import { useEffect, useState } from "react";

export function useDelayedLoading(isLoading: boolean, delay = 160) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setVisible(false);
      return;
    }

    const timeoutId = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timeoutId);
  }, [delay, isLoading]);

  return visible;
}
