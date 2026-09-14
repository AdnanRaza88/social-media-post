import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SETTINGS, SEED_COMMENTS, SEED_DOCS, SEED_JOB } from "./seed";
import { uid, nowIso } from "./ids";
import type {
  Activity,
  CommentItem,
  Job,
  NodeState,
  Platform,
  Settings,
  VaultDoc,
} from "./types";

type RelayState = {
  hydrated: boolean;
  jobs: Job[];
  comments: CommentItem[];
  docs: VaultDoc[];
  settings: Settings;
  activity: Activity[];
  node: NodeState;
  setHydrated: () => void;
  log: (text: string, tone?: Activity["tone"]) => void;
  upsertJob: (job: Job) => void;
  patchJob: (id: string, patch: Partial<Job>) => void;
  addComment: (item: CommentItem) => void;
  patchComment: (id: string, patch: Partial<CommentItem>) => void;
  addDoc: (doc: VaultDoc) => void;
  removeDoc: (id: string) => void;
  patchDoc: (id: string, patch: Partial<VaultDoc>) => void;
  patchSettings: (patch: Partial<Settings>) => void;
  patchPlatform: (platform: Platform, patch: Partial<Settings["platforms"][Platform]>) => void;
  setTelegramOffset: (offset: number) => void;
  touchPoll: (error?: string) => void;
  resetNode: () => void;
};

export const useRelay = create<RelayState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      jobs: [SEED_JOB],
      comments: SEED_COMMENTS,
      docs: SEED_DOCS,
      settings: DEFAULT_SETTINGS,
      activity: [
        {
          id: "a0",
          at: SEED_JOB.updatedAt,
          text: "Sentinel watching CHECKLIST on the batching film.",
          tone: "live",
        },
        {
          id: "a1",
          at: SEED_JOB.createdAt,
          text: "Pipeline finished — 4 drafts in review.",
          tone: "ok",
        },
      ],
      node: { startedAt: "2026-09-14T12:00:00.000Z", telegramOffset: 0 },
      setHydrated: () => set({ hydrated: true }),
      log: (text, tone = "info") =>
        set({
          activity: [{ id: uid("act"), at: nowIso(), text, tone }, ...get().activity].slice(0, 40),
        }),
      upsertJob: (job) =>
        set({
          jobs: [job, ...get().jobs.filter((j) => j.id !== job.id)].slice(0, 40),
        }),
      patchJob: (id, patch) =>
        set({
          jobs: get().jobs.map((j) => (j.id === id ? { ...j, ...patch, updatedAt: nowIso() } : j)),
        }),
      addComment: (item) => set({ comments: [item, ...get().comments].slice(0, 80) }),
      patchComment: (id, patch) =>
        set({
          comments: get().comments.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }),
      addDoc: (doc) => set({ docs: [doc, ...get().docs] }),
      removeDoc: (id) => set({ docs: get().docs.filter((d) => d.id !== id) }),
      patchDoc: (id, patch) =>
        set({ docs: get().docs.map((d) => (d.id === id ? { ...d, ...patch } : d)) }),
      patchSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      patchPlatform: (platform, patch) =>
        set({
          settings: {
            ...get().settings,
            platforms: {
              ...get().settings.platforms,
              [platform]: { ...get().settings.platforms[platform], ...patch },
            },
          },
        }),
      setTelegramOffset: (offset) => set({ node: { ...get().node, telegramOffset: offset } }),
      touchPoll: (error) =>
        set({
          node: {
            ...get().node,
            lastPollAt: nowIso(),
            lastError: error,
          },
        }),
      resetNode: () => set({ node: { startedAt: nowIso(), telegramOffset: get().node.telegramOffset } }),
    }),
    {
      name: "relay-node-v1",
      partialize: (s) => ({
        jobs: s.jobs,
        comments: s.comments,
        docs: s.docs,
        settings: s.settings,
        activity: s.activity.slice(0, 20),
        node: { telegramOffset: s.node.telegramOffset, startedAt: s.node.startedAt },
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
