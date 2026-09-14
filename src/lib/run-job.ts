import { publishToPlatform, runDeskPipeline } from "./actions";
import { AGENTS } from "./types";
import { nowIso } from "./ids";
import { useRelay } from "./store";
import type { AgentId, Job, StageLog, StageStatus } from "./types";

function setStage(job: Job, agent: AgentId, status: StageStatus, detail: string, tool?: string): Job {
  const stages: StageLog[] = job.stages.some((s) => s.agent === agent)
    ? job.stages.map((s) =>
        s.agent === agent
          ? {
              ...s,
              status,
              detail,
              tool: tool ?? s.tool,
              startedAt: status === "running" ? nowIso() : s.startedAt,
              finishedAt: status === "done" || status === "error" ? nowIso() : s.finishedAt,
            }
          : s,
      )
    : [
        ...job.stages,
        {
          agent,
          status,
          detail,
          tool,
          startedAt: nowIso(),
          finishedAt: status === "done" || status === "error" ? nowIso() : undefined,
        },
      ];
  return { ...job, stages, updatedAt: nowIso() };
}

export async function executeJob(jobId: string): Promise<void> {
  const store = useRelay.getState();
  const existing = store.jobs.find((j) => j.id === jobId);
  if (!existing) return;

  let job: Job = { ...existing, status: "running" };
  for (const agent of AGENTS) {
    if (!job.stages.some((s) => s.agent === agent)) {
      job = setStage(job, agent, "idle", "Waiting");
    }
  }
  store.upsertJob(job);

  const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

  job = setStage(job, "ingest", "done", job.mediaName ? `Accepted · ${job.mediaName}` : "Text ingest", "ingest_media");
  store.upsertJob(job);
  await pause(280);

  job = setStage(job, "transcriber", "running", "Listening…", "transcribe_audio");
  store.upsertJob(job);
  await pause(320);

  job = setStage(job, "transcriber", "done", job.transcript || job.script ? "Transcript ready" : "Using provided notes", "transcribe_audio");
  job = setStage(job, "analyst", "running", "Reading the film…", "analyze_content");
  job = setStage(job, "seo", "running", "Mapping discovery…", "generate_seo_pack");
  job = setStage(job, "writer", "running", "Writing per network…", "draft_platform_post");
  store.upsertJob(job);

  const result = await runDeskPipeline({
    data: {
      titleHint: job.title,
      script: job.script,
      transcript: job.transcript,
      platforms: job.platforms,
      brandVoice: store.settings.brandVoice,
      promisedHint: store.docs[0]?.name,
    },
  });

  if (!result.ok) {
    job = { ...job, status: "failed" };
    job = setStage(job, "analyst", "error", result.error, "analyze_content");
    store.upsertJob(job);
    store.log(`Desk failed · ${result.error}`, "warn");
    return;
  }

  const pack = result.data;
  job = {
    ...job,
    title: pack.title || job.title,
    transcript: pack.transcript || job.transcript || job.script,
    analysis: pack.analysis,
    seo: pack.seo,
    drafts: pack.drafts,
  };
  job = setStage(job, "analyst", "done", pack.analysis.summary.slice(0, 80), "analyze_content");
  job = setStage(job, "seo", "done", `Primary · ${pack.seo.primaryKeyword}`, "generate_seo_pack");
  job = setStage(job, "writer", "done", `Drafts · ${Object.keys(pack.drafts).length} networks`, "draft_platform_post");
  store.upsertJob(job);
  await pause(240);

  job = setStage(job, "publisher", "running", "Checking credentials…", "publish_post");
  store.upsertJob(job);

  if (store.settings.autoPublish) {
    for (const platform of job.platforms) {
      const creds = store.settings.platforms[platform];
      const draft = job.drafts[platform];
      if (!draft || !creds.enabled) continue;
      const pub = await publishToPlatform({
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
      job = {
        ...job,
        publishes: {
          ...job.publishes,
          [platform]: pub.ok
            ? { status: "live", url: pub.url, publishedAt: nowIso() }
            : { status: "error", error: pub.error },
        },
      };
    }
  } else {
    job = {
      ...job,
      publishes: Object.fromEntries(job.platforms.map((p) => [p, { status: "queued" as const }])),
    };
  }

  const liveCount = Object.values(job.publishes).filter((p) => p?.status === "live").length;
  job = setStage(
    job,
    "publisher",
    "done",
    liveCount ? `${liveCount} live` : "Queued for review — connect APIs to go live",
    "publish_post",
  );
  job = setStage(job, "sentinel", "done", "Watching comments", "list_comments");
  job = setStage(
    job,
    "fulfillment",
    "done",
    pack.analysis.promisedAssets.length ? `Armed · ${pack.analysis.promisedAssets.join(", ")}` : "No promise detected",
    "match_vault_document",
  );
  job = {
    ...job,
    status: liveCount === job.platforms.length ? "published" : liveCount ? "partial" : "needs_review",
  };
  store.upsertJob(job);
  store.log(`Desk finished · ${job.title}`, "ok");
}
