import type { AgentId, McpTool } from "@/lib/types";

export const MCP_TOOLS: McpTool[] = [
  { name: "ingest_media", agent: "ingest", description: "Accept video, audio, script, or Telegram payload." },
  { name: "transcribe_audio", agent: "transcriber", description: "Grok STT — transcript, language, word timestamps." },
  { name: "analyze_content", agent: "analyst", description: "Topics, audience, hook, CTA, promised assets." },
  { name: "generate_seo_pack", agent: "seo", description: "Primary keyword, intent map, discovery hashtags." },
  { name: "draft_platform_post", agent: "writer", description: "Title, caption, tags, first comment per network." },
  { name: "publish_post", agent: "publisher", description: "Push to YouTube, LinkedIn, Instagram, TikTok." },
  { name: "list_comments", agent: "sentinel", description: "Pull recent comments for a live post." },
  { name: "classify_comment", agent: "sentinel", description: "Sentiment, question, lead, promise match." },
  { name: "reply_comment", agent: "sentinel", description: "Draft and send a public reply." },
  { name: "match_vault_document", agent: "fulfillment", description: "Find the promised file from trigger phrases." },
  { name: "send_dm", agent: "fulfillment", description: "Share the document privately with the commenter." },
  { name: "telegram_poll", agent: "ingest", description: "Long-poll the Telegram bot for new videos." },
];

export function toolsFor(agent: AgentId): McpTool[] {
  return MCP_TOOLS.filter((t) => t.agent === agent);
}
