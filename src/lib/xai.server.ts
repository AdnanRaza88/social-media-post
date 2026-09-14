const XAI = "https://api.x.ai/v1";

export async function grokChat(system: string, user: string, maxTokens = 1800): Promise<
  { ok: true; text: string } | { ok: false; error: string }
> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI is not available in this environment" };

  const res = await fetch(`${XAI}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.4,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: `xAI error ${res.status}${body ? `: ${body.slice(0, 180)}` : ""}` };
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return { ok: true, text: json.choices?.[0]?.message?.content ?? "" };
}

export function extractJson<T>(text: string): T | null {
  const trimmed = text.trim();
  const block = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = block?.[1] ?? trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

export async function grokSttFromUrl(url: string): Promise<
  { ok: true; text: string; language?: string } | { ok: false; error: string }
> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI is not available in this environment" };

  const form = new FormData();
  form.set("url", url);
  form.set("language", "en");

  const res = await fetch(`${XAI}/stt`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    return { ok: false, error: `STT error ${res.status}` };
  }
  const json = (await res.json()) as { text?: string; language?: string };
  return { ok: true, text: json.text ?? "", language: json.language };
}

export async function grokSttFromBytes(
  bytes: ArrayBuffer,
  filename: string,
  mime: string,
): Promise<{ ok: true; text: string; language?: string } | { ok: false; error: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI is not available in this environment" };

  const form = new FormData();
  form.set("file", new Blob([bytes], { type: mime || "application/octet-stream" }), filename);
  form.set("format", "true");

  const res = await fetch(`${XAI}/stt`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) return { ok: false, error: `STT error ${res.status}` };
  const json = (await res.json()) as { text?: string; language?: string };
  return { ok: true, text: json.text ?? "", language: json.language };
}
