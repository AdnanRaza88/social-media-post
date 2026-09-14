import { PLAYBOOKS } from "./playbooks";
import type { ContentAnalysis, Platform, PlatformDraft, SeoPack } from "./types";
import { extractJson, grokChat } from "./xai.server";

export type PipelineInput = {
  titleHint?: string;
  script?: string;
  transcript?: string;
  platforms: Platform[];
  brandVoice: string;
  promisedHint?: string;
};

export type PipelineResult = {
  title: string;
  transcript: string;
  analysis: ContentAnalysis;
  seo: SeoPack;
  drafts: Partial<Record<Platform, PlatformDraft>>;
};

const SYSTEM = `You are the orchestrator for Relay, a multi-agent social desk.
Return ONLY valid JSON. No markdown. Match the language of the source.
Never use emoji. Never invent facts that are not in the source.
Respect each platform playbook exactly.`;

export async function runContentPipeline(input: PipelineInput): Promise<
  { ok: true; data: PipelineResult } | { ok: false; error: string }
> {
  const source = (input.transcript || input.script || input.titleHint || "").trim();
  if (!source) return { ok: false, error: "Need a script, transcript, or note to run the desk." };

  const platformBlock = input.platforms
    .map((p) => `### ${p}\n${PLAYBOOKS[p]}`)
    .join("\n\n");

  const user = `Brand voice: ${input.brandVoice}

Source title hint: ${input.titleHint || "(none)"}
Promised asset hint: ${input.promisedHint || "(detect from source)"}
Platforms: ${input.platforms.join(", ")}

SOURCE:
"""
${source.slice(0, 12000)}
"""

Playbooks:
${platformBlock}

JSON shape:
{
  "title": "internal job title, ≤80 chars",
  "transcript": "cleaned transcript or the source itself",
  "analysis": {
    "summary": "2 sentences",
    "topics": ["..."],
    "audience": "...",
    "hook": "...",
    "cta": "...",
    "promisedAssets": ["checklist" | "pdf" | "link" | ...],
    "tone": "...",
    "language": "en" | "ur" | "..."
  },
  "seo": {
    "primaryKeyword": "...",
    "secondaryKeywords": ["..."],
    "searchIntents": ["..."],
    "hashtags": ["without#"]
  },
  "drafts": {
    "youtube": { "title": "", "description": "", "tags": [], "firstComment": "", "chapters": [{"at":"0:00","label":""}], "coverText": "" },
    "linkedin": { "title": "", "description": "", "tags": [], "firstComment": "" },
    "instagram": { "title": "", "description": "", "tags": [], "firstComment": "", "coverText": "" },
    "tiktok": { "title": "", "description": "", "tags": [], "firstComment": "", "coverText": "" }
  }
}
Only include drafts for the requested platforms.`;

  const chat = await grokChat(SYSTEM, user, 2200);
  if (!chat.ok) {
    return { ok: true, data: localFallback(input, source) };
  }

  const parsed = extractJson<PipelineResult>(chat.text);
  if (!parsed?.analysis || !parsed.drafts) {
    return { ok: true, data: localFallback(input, source) };
  }
  return { ok: true, data: parsed };
}

export async function draftCommentReply(input: {
  brandVoice: string;
  postTitle: string;
  comment: string;
  isLead: boolean;
  promisedAsset?: string;
}): Promise<{ ok: true; reply: string; isLead: boolean; sentiment: string } | { ok: false; error: string }> {
  const chat = await grokChat(
    `You write public comment replies for a creator desk. No emoji. Short. Specific. JSON only.`,
    `Brand voice: ${input.brandVoice}
Post: ${input.postTitle}
Comment: ${input.comment}
Known lead?: ${input.isLead}
Promised asset: ${input.promisedAsset || "none"}

JSON: { "reply": "≤280 chars", "isLead": boolean, "sentiment": "positive|question|lead|negative|neutral", "promisedAsset": "..." }`,
    400,
  );
  if (!chat.ok) {
    const lead = input.isLead || /checklist|send|pdf|guide|please/i.test(input.comment);
    return {
      ok: true,
      reply: lead
        ? "Sending that over privately now — thank you for asking."
        : "Good question. The method is in the video; start with pass one and do not film until the hooks are written.",
      isLead: lead,
      sentiment: lead ? "lead" : "question",
    };
  }
  const parsed = extractJson<{ reply: string; isLead: boolean; sentiment: string }>(chat.text);
  if (!parsed?.reply) {
    return { ok: false, error: "Could not draft a reply" };
  }
  return { ok: true, reply: parsed.reply, isLead: parsed.isLead, sentiment: parsed.sentiment };
}

function localFallback(input: PipelineInput, source: string): PipelineResult {
  const hook = (input.titleHint || source.split(/[.!?]/)[0] || "New film").slice(0, 70);
  const analysis: ContentAnalysis = {
    summary: source.slice(0, 240),
    topics: ["creator operations"],
    audience: "Working creators",
    hook,
    cta: input.promisedHint ? `Comment to receive ${input.promisedHint}` : "Save this and run it once this week.",
    promisedAssets: input.promisedHint ? [input.promisedHint] : [],
    tone: "Direct",
    language: /[\u0600-\u06FF]/.test(source) ? "ur" : "en",
  };
  const seo: SeoPack = {
    primaryKeyword: hook.toLowerCase().slice(0, 40),
    secondaryKeywords: ["workflow", "batching"],
    searchIntents: ["how to"],
    hashtags: ["creator", "workflow"],
  };
  const drafts: Partial<Record<Platform, PlatformDraft>> = {};
  for (const p of input.platforms) {
    drafts[p] = {
      title: p === "youtube" ? hook : "",
      description: source.slice(0, 500),
      tags: seo.hashtags,
      firstComment: analysis.cta,
      coverText: hook.slice(0, 28),
    };
  }
  return { title: hook, transcript: source, analysis, seo, drafts };
}
