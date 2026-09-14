import { useEffect } from "react";
import { useRelay } from "./store";

export function useEnsureHydrated() {
  const hydrated = useRelay((s) => s.hydrated);
  const setHydrated = useRelay((s) => s.setHydrated);
  useEffect(() => {
    if (!hydrated) {
      const t = window.setTimeout(() => setHydrated(), 30);
      return () => window.clearTimeout(t);
    }
  }, [hydrated, setHydrated]);
  return hydrated;
}
