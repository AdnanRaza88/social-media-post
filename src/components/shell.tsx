import { Link, useRouterState } from "@tanstack/react-router";
import { Inbox, LayoutGrid, PenLine, Radio, Settings2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { formatUptime } from "@/lib/ids";
import { startNodeLoop, stopNodeLoop } from "@/lib/node-runtime";
import { useRelay } from "@/lib/store";

const NAV = [
  { to: "/", label: "Desk", icon: LayoutGrid },
  { to: "/compose", label: "Compose", icon: PenLine },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/agents", label: "Agents", icon: Radio },
  { to: "/settings", label: "Settings", icon: Settings2 },
] as const;

export function Shell({ children, title, action }: { children: ReactNode; title: string; action?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hydrated = useRelay((s) => s.hydrated);
  const comments = useRelay((s) => s.comments);
  const keepAwake = useRelay((s) => s.settings.keepAwake);
  const telegramOn = useRelay((s) => s.settings.telegram.enabled);

  useEffect(() => {
    if (!hydrated) return;
    startNodeLoop();
    return () => stopNodeLoop();
  }, [hydrated, keepAwake, telegramOn]);

  const unread = comments.filter((c) => c.replyStatus === "pending").length;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-border bg-surface md:flex">
        <div className="px-5 pb-6 pt-7">
          <Link to="/" className="block">
            <p className="font-display text-3xl leading-none tracking-tight">Relay</p>
            <p className="mt-1 text-2xs uppercase tracking-mark text-subtle">Social desk</p>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150",
                  active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/60 hover:text-fg",
                )}
              >
                <item.icon className="size-4" strokeWidth={1.75} />
                <span>{item.label}</span>
                {item.to === "/inbox" && unread > 0 ? (
                  <span className="ml-auto tabular-nums text-2xs text-warn">{unread}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-5">
          <NodeChip />
        </div>
      </aside>

      <div className="md:pl-56">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-sm md:px-8">
          <div className="min-w-0">
            <p className="text-2xs uppercase tracking-mark text-subtle">Relay node</p>
            <h1 className="truncate font-display text-2xl leading-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <NodeChip />
            </div>
            {action}
          </div>
        </header>
        <main className="px-4 pb-28 pt-5 md:px-8 md:pb-12">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur-sm md:hidden">
        <div className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-14 min-w-11 flex-1 flex-col items-center justify-center gap-1 text-2xs tracking-wide",
                  active ? "text-fg" : "text-subtle",
                )}
              >
                <item.icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function NodeChip() {
  const startedAt = useRelay((s) => s.node.startedAt);
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    const t = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-full bg-elevated px-3 py-1.5 shadow-[var(--shadow-border)]">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-2 animate-ping rounded-full bg-live opacity-40" />
        <span className="relative inline-flex size-2 rounded-full bg-live" />
      </span>
      <span className="text-2xs uppercase tracking-mark text-muted">Live</span>
      <span className="font-mono text-2xs tabular-nums text-fg" suppressHydrationWarning>
        {mounted ? formatUptime(startedAt) : "00:00:00"}
      </span>
    </div>
  );
}
