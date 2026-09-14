import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/shell";
import { publishToPlatform } from "@/lib/actions";
import { nowIso } from "@/lib/ids";
import { AGENT_META, PLATFORM_META } from "@/lib/playbooks";
import { executeJob } from "@/lib/run-job";
import { useRelay } from "@/lib/store";
import type { AgentId, Platform } from "@/lib/types";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/job/$id")({ component: JobPage });

function JobPage() {
  const { id } = Route.useParams();
  const job = useRelay((s) => s.jobs.find((j) => j.id === id));
  const settings = useRelay((s) => s.settings);
  const patchJob = useRelay((s) => s.patchJob);
  const log = useRelay((s) => s.log);
  const [publishing, setPublishing] = useState<Platform | null>(null);
  const [rerunning, setRerunning] = useState(false);

  if (!job) {
    return (
      <Shell title="Missing">
        <p className="text-muted">This job is not on the desk.</p>
        <Button asChild variant="secondary" className="mt-4">
          <Link to="/">Back</Link>
        </Button>
      </Shell>
    );
  }

  const current = job;

  async function publish(platform: Platform) {
    const draft = current.drafts[platform];
    const creds = settings.platforms[platform];
    if (!draft) return;
    setPublishing(platform);
    const res = await publishToPlatform({
      data: {
        platform,
        accessToken: creds.accessToken,
        apiKey: creds.apiKey,
        extra: creds.extra,
        title: draft.title,
        description: draft.description,
        tags: draft.tags,
      },
    });
    patchJob(current.id, {
      publishes: {
        ...current.publishes,
        [platform]: res.ok
          ? { status: "live", url: res.url, publishedAt: nowIso() }
          : { status: "error", error: res.error },
      },
    });
    log(res.ok ? `Published · ${platform}` : `Publish blocked · ${platform}`, res.ok ? "ok" : "warn");
    toast(res.ok ? `Live on ${PLATFORM_META[platform].label}` : res.error);
    setPublishing(null);
  }

  return (
    <Shell
      title={job.title}
      action={
        <Button
          variant="secondary"
          disabled={rerunning}
          onClick={async () => {
            setRerunning(true);
            await executeJob(job.id);
            setRerunning(false);
          }}
        >
          {rerunning ? "Running…" : "Run again"}
        </Button>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-8">
          {job.analysis ? (
            <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Analyst</p>
              <p className="mt-3 text-sm leading-relaxed text-fg">{job.analysis.summary}</p>
              <p className="mt-3 text-sm text-muted">
                Hook · {job.analysis.hook}
                <br />
                CTA · {job.analysis.cta}
              </p>
              {job.analysis.promisedAssets.length ? (
                <p className="mt-3 text-xs text-warn">Promise · {job.analysis.promisedAssets.join(", ")}</p>
              ) : null}
            </section>
          ) : null}

          {job.seo ? (
            <section>
              <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">SEO</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="fg">{job.seo.primaryKeyword}</Badge>
                {job.seo.secondaryKeywords.map((k) => (
                  <Badge key={k}>{k}</Badge>
                ))}
                {job.seo.hashtags.map((h) => (
                  <Badge key={h} tone="muted">
                    #{h}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}

          {job.transcript ? (
            <section>
              <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Transcript</p>
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-surface p-5 text-sm leading-relaxed text-muted shadow-[var(--shadow-border)]">
                {job.transcript}
              </p>
            </section>
          ) : null}

          <section className="flex flex-col gap-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Network drafts</p>
            {job.platforms.map((p) => {
              const draft = job.drafts[p];
              const pub = job.publishes[p];
              return (
                <article key={p} className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{PLATFORM_META[p].label}</p>
                      <p className="text-[11px] text-subtle">{PLATFORM_META[p].handle}</p>
                    </div>
                    <Badge
                      tone={
                        pub?.status === "live" ? "live" : pub?.status === "error" ? "danger" : "warn"
                      }
                    >
                      {pub?.status ?? "idle"}
                    </Badge>
                  </div>
                  {draft ? (
                    <>
                      {draft.title ? <p className="mt-4 font-display text-xl leading-snug">{draft.title}</p> : null}
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">{draft.description}</p>
                      {draft.firstComment ? (
                        <p className="mt-3 text-xs text-subtle">First comment · {draft.firstComment}</p>
                      ) : null}
                      {pub?.error ? <p className="mt-3 text-xs text-danger">{pub.error}</p> : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const pack = [draft.title, draft.description, draft.firstComment].filter(Boolean).join("\n\n");
                            void navigator.clipboard.writeText(pack);
                            toast("Copied pack");
                          }}
                        >
                          <Copy className="size-3.5" /> Copy pack
                        </Button>
                        <Button size="sm" disabled={publishing === p} onClick={() => void publish(p)}>
                          {publishing === p ? "Publishing…" : "Publish"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-muted">No draft yet.</p>
                  )}
                </article>
              );
            })}
          </section>
        </div>

        <aside>
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Agents</p>
          <ol className="mt-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]">
            {job.stages.map((stage) => (
              <li key={stage.agent} className="flex gap-3 px-2 py-2.5">
                <StatusIcon status={stage.status} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{AGENT_META[stage.agent as AgentId]?.label ?? stage.agent}</p>
                  <p className="truncate text-xs text-muted">{stage.detail}</p>
                  {stage.tool ? <p className="mt-0.5 font-mono text-[10px] text-subtle">{stage.tool}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </Shell>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "running") return <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-accent" />;
  if (status === "done") return <Check className="mt-0.5 size-4 shrink-0 text-live" />;
  return (
    <span
      className={cn(
        "mt-1.5 size-2 shrink-0 rounded-full",
        status === "error" ? "bg-danger" : "bg-subtle",
      )}
    />
  );
}
