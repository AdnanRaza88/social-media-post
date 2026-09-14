import type { CommentItem, Job, Settings, VaultDoc } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  brandVoice:
    "Direct, specific, and calm. Teach like a senior operator. Match the language of the source. No hype, no emoji.",
  autoPublish: false,
  autoReply: true,
  autoDm: true,
  keepAwake: true,
  telegram: { enabled: false, botToken: "", allowedChatId: "" },
  platforms: {
    youtube: { enabled: true, apiKey: "", accessToken: "", extra: "" },
    linkedin: { enabled: true, apiKey: "", accessToken: "", extra: "" },
    instagram: { enabled: true, apiKey: "", accessToken: "", extra: "" },
    tiktok: { enabled: true, apiKey: "", accessToken: "", extra: "" },
  },
};

const t0 = Date.parse("2026-09-14T12:00:00.000Z");
const iso = (minsAgo: number) => new Date(t0 - minsAgo * 60000).toISOString();

export const SEED_JOB: Job = {
  id: "job_seed01",
  source: "compose",
  title: "How I batch 30 shorts in one sitting",
  mediaName: "batch-30-shorts.mp4",
  mediaKind: "video",
  script:
    "I used to post one short a day and burn out. Now I batch 30 in a single sitting. The trick is not more coffee — it is a three-pass desk: research, record, then cut. Pass one, I write 30 hooks on paper. Pass two, I film them against the same wall in 40 minutes. Pass three, I cut with captions and queue them. If you want the checklist I use, comment CHECKLIST and I will send it.",
  transcript:
    "I used to post one short a day and burn out. Now I batch 30 in a single sitting. The trick is not more coffee — it is a three-pass desk: research, record, then cut. Pass one, I write 30 hooks on paper. Pass two, I film them against the same wall in 40 minutes. Pass three, I cut with captions and queue them. If you want the checklist I use, comment CHECKLIST and I will send it.",
  analysis: {
    summary:
      "A process video on batching 30 short-form videos in one session using a three-pass desk: hooks, filming, then cutting.",
    topics: ["short-form batching", "creator operations", "hook writing", "editing workflow"],
    audience: "Solo creators who post inconsistently and want a repeatable desk.",
    hook: "Stop posting one a day. Batch thirty.",
    cta: "Comment CHECKLIST to receive the one-page batching sheet.",
    promisedAssets: ["checklist"],
    tone: "Calm operator, specific, no hype.",
    language: "en",
  },
  seo: {
    primaryKeyword: "batch short form videos",
    secondaryKeywords: ["content batching", "youtube shorts workflow", "creator system"],
    searchIntents: ["how to batch content", "shorts workflow"],
    hashtags: ["contentbatching", "shortform", "creatorsystem", "youtubeShorts"],
  },
  drafts: {
    youtube: {
      title: "I Batch 30 Shorts in One Sitting (Three-Pass Desk)",
      description:
        "A one-session system for 30 shorts: research, record, cut.\n\nThe three passes\n0:00 Why daily posting burns out\n0:28 Pass 1 — 30 hooks on paper\n1:12 Pass 2 — film one wall, 40 minutes\n2:04 Pass 3 — captions and queue\n\nComment CHECKLIST and I send the one-pager.\n\n#shorts #contentbatching #creatorsystem",
      tags: ["content batching", "youtube shorts", "creator workflow", "short form"],
      firstComment: "Want the one-page checklist? Comment CHECKLIST — I send it privately.",
      chapters: [
        { at: "0:00", label: "The burnout loop" },
        { at: "0:28", label: "Pass 1 — hooks" },
        { at: "1:12", label: "Pass 2 — film" },
        { at: "2:04", label: "Pass 3 — cut and queue" },
      ],
    },
    linkedin: {
      title: "",
      description:
        "I stopped posting one short a day.\n\nI now batch 30 in a single sitting with a three-pass desk:\n1. Write 30 hooks on paper.\n2. Film them on the same wall in 40 minutes.\n3. Cut, caption, queue.\n\nConsistency is an operations problem, not a motivation problem.\n\nComment CHECKLIST and I will send the one-pager.\n\n#ContentOperations #ShortForm #CreatorEconomy",
      tags: ["ContentOperations", "ShortForm", "CreatorEconomy"],
      firstComment: "",
    },
    instagram: {
      title: "",
      description:
        "Stop posting one a day.\n\nThree passes. One sitting. Thirty shorts.\nWrite the hooks. Film the wall. Cut the queue.\n\nComment CHECKLIST and I send the sheet.\n\n#contentbatching #reelsworkflow #creatorsystem #shortformstrategy #batchcreate",
      tags: ["contentbatching", "reelsworkflow", "creatorsystem"],
      firstComment: "What is the bottleneck — hooks, filming, or cutting?",
      coverText: "30 shorts. One sitting.",
    },
    tiktok: {
      title: "",
      description:
        "I batch 30 shorts in one sitting. Not more coffee. A three-pass desk. Comment CHECKLIST.\n\n#contentbatching #creator #workflow #shorts",
      tags: ["contentbatching", "creator", "workflow"],
      firstComment: "Part 2 is the hook list I actually use.",
      coverText: "Batch 30. One sitting.",
    },
  },
  publishes: {
    youtube: { status: "queued" },
    linkedin: { status: "queued" },
    instagram: { status: "queued" },
    tiktok: { status: "queued" },
  },
  stages: [
    { agent: "ingest", status: "done", detail: "Video accepted · batch-30-shorts.mp4", tool: "ingest_media", finishedAt: iso(86) },
    { agent: "transcriber", status: "done", detail: "Transcript 412 characters · en", tool: "transcribe_audio", finishedAt: iso(85) },
    { agent: "analyst", status: "done", detail: "Promise detected: checklist", tool: "analyze_content", finishedAt: iso(84) },
    { agent: "seo", status: "done", detail: "Primary: batch short form videos", tool: "generate_seo_pack", finishedAt: iso(83) },
    { agent: "writer", status: "done", detail: "Drafts ready for 4 platforms", tool: "draft_platform_post", finishedAt: iso(82) },
    { agent: "publisher", status: "done", detail: "Queued — connect APIs in Settings to go live", tool: "publish_post", finishedAt: iso(81) },
    { agent: "sentinel", status: "done", detail: "Watching comments for CHECKLIST", tool: "list_comments", finishedAt: iso(12) },
    { agent: "fulfillment", status: "done", detail: "Vault armed · Batching checklist", tool: "match_vault_document", finishedAt: iso(12) },
  ],
  platforms: ["youtube", "linkedin", "instagram", "tiktok"],
  createdAt: iso(90),
  updatedAt: iso(12),
  status: "needs_review",
};

export const SEED_COMMENTS: CommentItem[] = [
  {
    id: "c_1",
    jobId: "job_seed01",
    platform: "youtube",
    author: "mira.builds",
    text: "This is the first workflow that actually sounds like a job, not a vibe. Saving this.",
    createdAt: iso(40),
    sentiment: "positive",
    isLead: false,
    reply: "Glad it reads as a desk, not a mood. The bottleneck is usually pass one — write the hooks before you pick up the camera.",
    replyStatus: "sent",
    dmStatus: "none",
  },
  {
    id: "c_2",
    jobId: "job_seed01",
    platform: "instagram",
    author: "k.studio",
    text: "CHECKLIST please — I keep stalling after filming.",
    createdAt: iso(18),
    sentiment: "lead",
    isLead: true,
    promisedAsset: "checklist",
    reply: "Sent the one-pager to your DMs. Pass three is where most people stall — captions first, polish later.",
    replyStatus: "drafted",
    dmStatus: "queued",
  },
  {
    id: "c_3",
    jobId: "job_seed01",
    platform: "tiktok",
    author: "omar.clips",
    text: "Do you write the hooks the night before or the same morning?",
    createdAt: iso(9),
    sentiment: "question",
    isLead: false,
    replyStatus: "pending",
    dmStatus: "none",
  },
  {
    id: "c_4",
    jobId: "job_seed01",
    platform: "linkedin",
    author: "Lina Farooq",
    text: "Would you run the same three-pass desk for long-form, or does that break?",
    createdAt: iso(6),
    sentiment: "question",
    isLead: false,
    replyStatus: "pending",
    dmStatus: "none",
  },
];

export const SEED_DOCS: VaultDoc[] = [
  {
    id: "doc_checklist",
    name: "Batching checklist",
    kind: "note",
    url: "https://relay.local/vault/batching-checklist",
    triggerPhrases: ["checklist", "one-pager", "sheet", "send me"],
    notes: "One-page three-pass desk: hooks, film, cut. Shared on CHECKLIST comments.",
  },
];
