import { useEffect, useState } from "react";

export function useTick(ms: number) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!ms) return;
    const t = window.setInterval(() => setN((n) => n + 1), ms);
    return () => window.clearInterval(t);
  }, [ms]);
}
