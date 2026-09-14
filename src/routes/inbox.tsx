import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Shell } from "@/components/shell";
import { fetchPlatformComments, replyToComment } from "@/lib/actions";
import { uid, nowIso, formatRelative } from "@/lib/ids";
import { PLATFORM_META } from "@/lib/playbooks";
import { useRelay } from "@/lib/store";
import { useEnsureHydrated } from "@/lib/use-hydrated";
import type { CommentItem, Platform } from "@/lib/types";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/inbox")({ component: Inbox });

function Inbox() {
  const hydrated = useEnsureHydrated();
  const comments = useRelay((s) => s.comments);
  const jobs = useRelay((s) => s.jobs);
  const docs = useRelay((s) => s.docs);
  const settings = useRelay((s) => s.settings);
  const patchComment = useRelay((s) => s.patchComment);
  const addComment = useRelay((s) => s.addComment);
  const log = useRelay((s) => s.log);
  const [filter, setFilter] = useState<"all" | "pending" | "leads">("all");
  const [activeId, setActiveId] = useState<string | null>(comments[0]?.id ?? null);
  const [busy, setBusy] = useState(false);

  const visible = useMemo(() => {
    return comments.filter((c) => {
      if (filter === "pending") return c.replyStatus === "pending" || c.replyStatus === "drafted";
      if (filter === "leads") return c.isLead;
      return true;
    });
  }, [comments, filter]);

  const active = comments.find((c) => c.id === activeId) ?? visible[0];

  async function draftReply(item: CommentItem) {
    setBusy(true);
    const job = jobs.find((j) => j.id === item.jobId);
    const res = await replyToComment({
      data: {
        brandVoice: settings.brandVoice,
        postTitle: job?.title ?? "the film",
        comment: item.text,
        isLead: item.isLead,
        promisedAsset: item.promisedAsset ?? job?.analysis?.promisedAssets[0],
      },
    });
    if (!res.ok) {
      toast(res.error);
      setBusy(false);
      return;
    }
    const lead = res.isLead || item.isLead;
    const doc = docs.find((d) =>
      d.triggerPhrases.some((p) => item.text.toLowerCase().includes(p.toLowerCase())),
    );
    patchComment(item.id, {
      reply: res.reply,
      replyStatus: "drafted",
      isLead: lead,
      sentiment: (res.sentiment as CommentItem["sentiment"]) ?? item.sentiment,
      promisedAsset: doc?.name ?? item.promisedAsset,
      dmStatus: lead ? "queued" : item.dmStatus,
    });
    log(`Sentinel drafted a reply for ${item.author}`, "ok");
    setBusy(false);
  }

  function sendReply(item: CommentItem) {
    patchComment(item.id, { replyStatus: "sent" });
    log(`Reply sent · ${item.platform}`, "ok");
    toast("Marked sent. Connect the network API to post it on-platform.");
  }

  function fulfill(item: CommentItem) {
    const doc =
      docs.find((d) => d.name === item.promisedAsset) ||
      docs.find((d) => d.triggerPhrases.some((p) => item.text.toLowerCase().includes(p.toLowerCase())));
    patchComment(item.id, { dmStatus: "sent", replyStatus: item.replyStatus === "pending" ? "drafted" : item.replyStatus });
    log(`DM · ${doc?.name ?? "document"} to ${item.author}`, "ok");
    toast(doc ? `Queued DM with ${doc.name}` : "No vault document matched — add one in Settings.");
  }

  async function pullYoutube() {
    const creds = settings.platforms.youtube;
    const live = jobs.find((j) => j.publishes.youtube?.url);
    const videoId = live?.publishes.youtube?.url?.replace("https://youtu.be/", "") ?? "";
    if (!videoId) {
      toast("Publish to YouTube first, or paste a video ID in Settings extra field.");
      return;
    }
    const res = await fetchPlatformComments({
      data: {
        platform: "youtube",
        accessToken: creds.accessToken,
        apiKey: creds.apiKey,
        videoId,
      },
    });
    if (!res.ok) {
      toast(res.error);
      return;
    }
    for (const c of res.comments) {
      addComment({
        id: uid("c"),
        jobId: live?.id,
        platform: "youtube",
        author: c.author,
        text: c.text,
        createdAt: c.createdAt,
        sentiment: "neutral",
        isLead: /checklist|send|pdf|guide/i.test(c.text),
        replyStatus: "pending",
        dmStatus: "none",
        remoteId: c.id,
      });
    }
    toast(`Pulled ${res.comments.length} comments`);
  }

  return (
    <Shell
      title="Inbox"
      action={
        <Button variant="secondary" size="sm" onClick={() => void pullYoutube()}>
          Pull YouTube
        </Button>
      }
    >
      {!hydrated ? (
        <div className="h-64 animate-pulse rounded-xl bg-surface" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <div>
            <div className="flex gap-2">
              {(["all", "pending", "leads"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "h-9 rounded-full px-3 text-xs capitalize",
                    filter === f ? "bg-accent text-accent-fg" : "bg-surface text-muted",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {visible.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      "w-full rounded-xl p-4 text-left shadow-[var(--shadow-border)]",
                      active?.id === c.id ? "bg-elevated" : "bg-surface",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{c.author}</p>
                      <span className="text-[11px] text-subtle">{formatRelative(c.createdAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{c.text}</p>
                    <div className="mt-2 flex gap-1.5">
                      <Badge>{PLATFORM_META[c.platform].label}</Badge>
                      {c.isLead ? <Badge tone="warn">lead</Badge> : null}
                      <Badge tone={c.replyStatus === "sent" ? "live" : "muted"}>{c.replyStatus}</Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {active ? (
            <article className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{active.author}</p>
                <Badge>{PLATFORM_META[active.platform].label}</Badge>
                {active.isLead ? <Badge tone="warn">lead</Badge> : null}
              </div>
              <p className="mt-4 text-base leading-relaxed">{active.text}</p>
              <p className="mt-3 text-xs text-subtle">{formatRelative(active.createdAt)}</p>

              <div className="mt-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Reply</p>
                <Textarea
                  className="mt-2"
                  value={active.reply ?? ""}
                  onChange={(e) => patchComment(active.id, { reply: e.target.value, replyStatus: "drafted" })}
                  placeholder="The sentinel will draft this."
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" disabled={busy} onClick={() => void draftReply(active)}>
                  {busy ? "Drafting…" : "Draft with Grok"}
                </Button>
                <Button disabled={!active.reply} onClick={() => sendReply(active)}>
                  Send reply
                </Button>
                {active.isLead || active.dmStatus !== "none" ? (
                  <Button variant="secondary" onClick={() => fulfill(active)}>
                    {active.dmStatus === "sent" ? "Document sent" : "DM the document"}
                  </Button>
                ) : null}
              </div>
            </article>
          ) : (
            <p className="text-sm text-muted">No comments in this filter.</p>
          )}
        </div>
      )}
    </Shell>
  );
}
