import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileVideo, Send } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Shell } from "@/components/shell";
import { transcribeFromUrl } from "@/lib/actions";
import { uid, nowIso } from "@/lib/ids";
import { PLATFORM_META } from "@/lib/playbooks";
import { executeJob } from "@/lib/run-job";
import { useRelay } from "@/lib/store";
import type { Job, Platform } from "@/lib/types";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/compose")({ component: Compose });

function Compose() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const settings = useRelay((s) => s.settings);
  const upsertJob = useRelay((s) => s.upsertJob);
  const log = useRelay((s) => s.log);
  const [selected, setSelected] = useState<Platform[]>(
    (Object.keys(settings.platforms) as Platform[]).filter((p) => settings.platforms[p].enabled),
  );

  function toggle(p: Platform) {
    setSelected((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }

  async function launch() {
    const script = note.trim();
    if (!script && !fileName && !url.trim()) {
      toast("Add a script, a video, or a media URL.");
      return;
    }
    const platforms = selected.length ? selected : (["youtube", "instagram"] as Platform[]);
    setBusy(true);
    let transcript = script;
    if (url.trim() && !script) {
      const stt = await transcribeFromUrl({ data: { url: url.trim() } });
      if (stt.ok) transcript = stt.text;
      else toast(stt.error);
    }
    const job: Job = {
      id: uid("job"),
      source: "compose",
      title: script.split(/[.!\n]/)[0]?.slice(0, 72) || fileName || "Untitled film",
      mediaName: fileName ?? undefined,
      mediaKind: fileName ? "video" : script ? "text" : "audio",
      script: script || undefined,
      transcript: transcript || undefined,
      drafts: {},
      publishes: Object.fromEntries(platforms.map((p) => [p, { status: "idle" as const }])),
      stages: [],
      platforms,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: "queued",
    };
    upsertJob(job);
    log(`Ingest · ${job.title}`, "live");
    try {
      await executeJob(job.id);
      toast("Desk finished. Review the drafts.");
      void navigate({ to: "/job/$id", params: { id: job.id } });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Pipeline failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title="Compose">
      <div className="mx-auto grid max-w-3xl gap-6">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex min-h-40 flex-col items-center justify-center rounded-xl bg-surface px-6 py-10 text-center shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
        >
          <FileVideo className="size-7 text-subtle" strokeWidth={1.5} />
          <p className="mt-3 font-display text-2xl">Drop the film</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Video stays on this phone. Paste a script if you already have one — the transcriber will use it.
          </p>
          {fileName ? <p className="mt-3 text-sm text-fg">{fileName}</p> : null}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="video/*,audio/*"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Desk chat</p>
          <Textarea
            className="mt-2 min-h-36"
            placeholder="Paste the script, talking points, or tell the desk what this film is. Urdu and English both work."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Public media URL</p>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https:// — optional, Grok STT will transcribe it"
            className="mt-2 flex h-11 w-full rounded-md bg-elevated px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus-visible:outline-none"
          />
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Networks</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(PLATFORM_META) as Platform[]).map((p) => {
              const on = selected.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggle(p)}
                  className={cn(
                    "rounded-lg px-3 py-3 text-left shadow-[var(--shadow-border)] transition-colors duration-150",
                    on ? "bg-accent text-accent-fg" : "bg-surface text-muted",
                  )}
                >
                  <p className="text-sm font-medium">{PLATFORM_META[p].label}</p>
                  <p className={cn("text-[11px]", on ? "text-accent-fg/70" : "text-subtle")}>{PLATFORM_META[p].handle}</p>
                </button>
              );
            })}
          </div>
        </div>

        <Button size="lg" disabled={busy} onClick={() => void launch()} className="w-full sm:w-auto">
          <Send className="size-4" />
          {busy ? "Running the desk…" : "Transcribe, write, queue"}
        </Button>
      </div>
    </Shell>
  );
}
