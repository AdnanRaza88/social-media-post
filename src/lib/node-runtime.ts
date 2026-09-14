import { telegramGetUpdates } from "./actions";
import { uid, nowIso } from "./ids";
import { useRelay } from "./store";
import type { Job, Platform } from "./types";

let wakeLock: WakeLockSentinel | null = null;
let pollTimer: number | null = null;
let running = false;

export async function requestWakeLock(): Promise<boolean> {
  try {
    if (!("wakeLock" in navigator)) return false;
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
    return true;
  } catch {
    return false;
  }
}

export async function releaseWakeLock() {
  try {
    await wakeLock?.release();
  } catch {
    /* ignore */
  }
  wakeLock = null;
}

function ingestTelegramMessage(msg: {
  text?: string;
  caption?: string;
  from?: { first_name?: string; username?: string };
  video?: { file_name?: string };
  document?: { file_name?: string };
}) {
  const text = (msg.caption || msg.text || "").trim();
  if (!text && !msg.video && !msg.document) return;
  const store = useRelay.getState();
  const platforms = (Object.keys(store.settings.platforms) as Platform[]).filter(
    (p) => store.settings.platforms[p].enabled,
  );
  const job: Job = {
    id: uid("job"),
    source: "telegram",
    title: text.slice(0, 72) || msg.video?.file_name || msg.document?.file_name || "Telegram film",
    mediaName: msg.video?.file_name || msg.document?.file_name,
    mediaKind: msg.video ? "video" : text ? "text" : "audio",
    script: text,
    drafts: {},
    publishes: Object.fromEntries(platforms.map((p) => [p, { status: "idle" as const }])),
    stages: [
      {
        agent: "ingest",
        status: "done",
        detail: `Telegram from ${msg.from?.username || msg.from?.first_name || "bot"}`,
        tool: "telegram_poll",
        finishedAt: nowIso(),
      },
    ],
    platforms: platforms.length ? platforms : ["youtube", "instagram", "tiktok", "linkedin"],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    status: "queued",
    telegramFrom: msg.from?.username || msg.from?.first_name,
  };
  store.upsertJob(job);
  store.log(`Telegram ingest · ${job.title}`, "live");
}

export function startNodeLoop() {
  if (running) return;
  running = true;

  const tick = async () => {
    const { settings, node, setTelegramOffset, touchPoll, log } = useRelay.getState();
    if (settings.keepAwake && !wakeLock) {
      await requestWakeLock();
    }
    if (!settings.keepAwake && wakeLock) {
      await releaseWakeLock();
    }
    if (settings.telegram.enabled && settings.telegram.botToken) {
      try {
        const res = await telegramGetUpdates({
          data: { token: settings.telegram.botToken, offset: node.telegramOffset },
        });
        if (!res.ok) {
          touchPoll(res.error);
        } else {
          let max = node.telegramOffset;
          for (const update of res.result) {
            max = Math.max(max, update.update_id + 1);
            if (update.message) ingestTelegramMessage(update.message);
          }
          if (max !== node.telegramOffset) setTelegramOffset(max);
          touchPoll();
        }
      } catch (err) {
        touchPoll(err instanceof Error ? err.message : "poll failed");
        log("Telegram poll failed", "warn");
      }
    } else {
      touchPoll();
    }
  };

  void tick();
  pollTimer = window.setInterval(() => void tick(), 12000);
}

export function stopNodeLoop() {
  running = false;
  if (pollTimer) window.clearInterval(pollTimer);
  pollTimer = null;
  void releaseWakeLock();
}
