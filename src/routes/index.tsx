import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/shell";
import { formatRelative } from "@/lib/ids";
import { PLATFORM_META } from "@/lib/playbooks";
import { useRelay } from "@/lib/store";
import { useEnsureHydrated } from "@/lib/use-hydrated";
import type { Job, JobStatus, Platform } from "@/lib/types";

export const Route = createFileRoute("/")({ component: Desk });

function Desk() {
  const hydrated = useEnsureHydrated();
  const jobs = useRelay((s) => s.jobs);
  const comments = useRelay((s) => s.comments);
  const activity = useRelay((s) => s.activity);
  const settings = useRelay((s) => s.settings);
  const lastPoll = useRelay((s) => s.node.lastPollAt);
  const lastError = useRelay((s) => s.node.lastError);

  const pending = comments.filter((c) => c.replyStatus === "pending").length;
  const leads = comments.filter((c) => c.isLead && c.dmStatus !== "sent").length;
  const livePlatforms = (Object.keys(settings.platforms) as Platform[]).filter(
    (p) => settings.platforms[p].enabled,
  ).length;

  return (
    <Shell
      title="Desk"
      action={
        <Button asChild>
          <Link to="/compose">New film</Link>
        </Button>
      }
    >
      {!hydrated ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Node" value={lastError ? "Degraded" : "Live"} hint={lastPoll ? `Polled ${formatRelative(lastPoll)}` : "Waiting on first poll"} tone={lastError ? "warn" : "live"} />
            <Stat label="Networks" value={String(livePlatforms)} hint="Armed in Settings" />
            <Stat label="Replies due" value={String(pending)} hint="Comment sentinel" tone={pending ? "warn" : "muted"} />
            <Stat label="Leads open" value={String(leads)} hint="Fulfillment queue" tone={leads ? "warn" : "muted"} />
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
            <div>
              <SectionLabel>Pipeline</SectionLabel>
              <div className="mt-3 flex flex-col gap-3">
                {jobs.length === 0 ? (
                  <Empty />
                ) : (
                  jobs.map((job) => <JobRow key={job.id} job={job} />)
                )}
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div>
                <SectionLabel>Activity</SectionLabel>
                <ol className="mt-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                  {activity.slice(0, 8).map((a) => (
                    <li key={a.id} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                      <span
                        className={
                          a.tone === "live"
                            ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-live"
                            : a.tone === "ok"
                              ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-accent"
                              : a.tone === "warn"
                                ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-warn"
                                : "mt-1.5 size-1.5 shrink-0 rounded-full bg-subtle"
                        }
                      />
                      <div className="min-w-0">
                        <p className="text-sm leading-snug">{a.text}</p>
                        <p className="mt-0.5 text-[11px] text-subtle">{formatRelative(a.at)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <SectionLabel>Telegram</SectionLabel>
                <div className="mt-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                  <p className="text-sm text-muted">
                    {settings.telegram.enabled && settings.telegram.botToken
                      ? "Bot is armed. Send a video or caption to the bot — this phone will ingest it."
                      : "Add a bot token in Settings. This phone becomes the ingest server."}
                  </p>
                  <Button asChild variant="secondary" size="sm" className="mt-3">
                    <Link to="/settings">Open connectors</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <h2 className="text-[11px] uppercase tracking-[0.18em] text-subtle">{children}</h2>;
}

function Stat({
  label,
  value,
  hint,
  tone = "muted",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "muted" | "live" | "warn";
}) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p className={`mt-2 font-display text-3xl leading-none ${tone === "live" ? "text-live" : tone === "warn" ? "text-warn" : ""}`}>
        {value}
      </p>
      <p className="mt-2 text-xs text-muted">{hint}</p>
    </div>
  );
}

function statusTone(status: JobStatus): "muted" | "live" | "warn" | "danger" | "fg" {
  if (status === "published") return "live";
  if (status === "running") return "fg";
  if (status === "failed") return "danger";
  if (status === "needs_review" || status === "partial") return "warn";
  return "muted";
}

function JobRow({ job }: { job: Job }) {
  return (
    <Link
      to="/job/$id"
      params={{ id: job.id }}
      className="group flex items-start justify-between gap-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(job.status)}>{job.status.replace("_", " ")}</Badge>
          <span className="text-[11px] uppercase tracking-wider text-subtle">{job.source}</span>
        </div>
        <p className="mt-2 truncate text-base font-medium">{job.title}</p>
        <p className="mt-1 text-xs text-muted">
          {job.platforms.map((p) => PLATFORM_META[p].label).join(" · ")} · {formatRelative(job.updatedAt)}
        </p>
      </div>
      <ArrowUpRight className="mt-1 size-4 shrink-0 text-subtle transition-colors group-hover:text-fg" />
    </Link>
  );
}

function Empty() {
  return (
    <div className="rounded-xl bg-surface px-5 py-10 text-center shadow-[var(--shadow-border)]">
      <Radio className="mx-auto size-6 text-subtle" strokeWidth={1.5} />
      <p className="mt-3 font-display text-2xl">Nothing on the desk</p>
      <p className="mt-1 text-sm text-muted">Drop a film or send one to Telegram.</p>
    </div>
  );
}
