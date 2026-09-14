export const PLATFORMS = ["youtube", "linkedin", "instagram", "tiktok"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const AGENTS = [
  "ingest",
  "transcriber",
  "analyst",
  "seo",
  "writer",
  "publisher",
  "sentinel",
  "fulfillment",
] as const;
export type AgentId = (typeof AGENTS)[number];

export type JobStatus =
  | "queued"
  | "running"
  | "needs_review"
  | "published"
  | "partial"
  | "failed";

export type StageStatus = "idle" | "running" | "done" | "error" | "skipped";

export type StageLog = {
  agent: AgentId;
  status: StageStatus;
  detail: string;
  tool?: string;
  startedAt?: string;
  finishedAt?: string;
};

export type ContentAnalysis = {
  summary: string;
  topics: string[];
  audience: string;
  hook: string;
  cta: string;
  promisedAssets: string[];
  tone: string;
  language: string;
};

export type SeoPack = {
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntents: string[];
  hashtags: string[];
};

export type PlatformDraft = {
  title: string;
  description: string;
  tags: string[];
  firstComment: string;
  coverText?: string;
  chapters?: { at: string; label: string }[];
};

export type PublishState = {
  status: "idle" | "queued" | "publishing" | "live" | "error";
  url?: string;
  error?: string;
  publishedAt?: string;
};

export type Job = {
  id: string;
  source: "compose" | "telegram";
  title: string;
  mediaName?: string;
  mediaKind?: "video" | "audio" | "text";
  script?: string;
  transcript?: string;
  analysis?: ContentAnalysis;
  seo?: SeoPack;
  drafts: Partial<Record<Platform, PlatformDraft>>;
  publishes: Partial<Record<Platform, PublishState>>;
  stages: StageLog[];
  platforms: Platform[];
  createdAt: string;
  updatedAt: string;
  status: JobStatus;
  telegramFrom?: string;
};

export type CommentItem = {
  id: string;
  jobId?: string;
  platform: Platform;
  author: string;
  text: string;
  createdAt: string;
  sentiment: "positive" | "question" | "lead" | "negative" | "neutral";
  isLead: boolean;
  promisedAsset?: string;
  reply?: string;
  replyStatus: "pending" | "drafted" | "sent" | "skipped";
  dmStatus: "none" | "queued" | "sent";
  remoteId?: string;
};

export type VaultDoc = {
  id: string;
  name: string;
  kind: "pdf" | "link" | "note";
  url: string;
  triggerPhrases: string[];
  notes?: string;
};

export type PlatformCreds = {
  enabled: boolean;
  apiKey: string;
  accessToken: string;
  extra: string;
};

export type Settings = {
  brandVoice: string;
  autoPublish: boolean;
  autoReply: boolean;
  autoDm: boolean;
  keepAwake: boolean;
  telegram: {
    enabled: boolean;
    botToken: string;
    allowedChatId: string;
  };
  platforms: Record<Platform, PlatformCreds>;
};

export type McpTool = {
  name: string;
  agent: AgentId;
  description: string;
  lastUsedAt?: string;
};

export type Activity = {
  id: string;
  at: string;
  text: string;
  tone: "info" | "live" | "warn" | "ok";
};

export type NodeState = {
  startedAt: string;
  telegramOffset: number;
  lastPollAt?: string;
  lastError?: string;
};
