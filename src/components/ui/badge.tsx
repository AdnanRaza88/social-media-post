import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Badge({
  className,
  tone = "muted",
  children,
}: {
  className?: string;
  tone?: "muted" | "live" | "warn" | "danger" | "fg";
  children: ReactNode;
}) {
  const tones = {
    muted: "text-muted bg-elevated",
    live: "text-live bg-live/10",
    warn: "text-warn bg-warn/10",
    danger: "text-danger bg-danger/10",
    fg: "text-accent-fg bg-accent",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
