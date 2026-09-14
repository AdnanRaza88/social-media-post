import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Shell } from "@/components/shell";
import { uid } from "@/lib/ids";
import { PLATFORM_META } from "@/lib/playbooks";
import { useRelay } from "@/lib/store";
import { useEnsureHydrated } from "@/lib/use-hydrated";
import type { Platform, VaultDoc } from "@/lib/types";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const hydrated = useEnsureHydrated();
  const settings = useRelay((s) => s.settings);
  const docs = useRelay((s) => s.docs);
  const patchSettings = useRelay((s) => s.patchSettings);
  const patchPlatform = useRelay((s) => s.patchPlatform);
  const addDoc = useRelay((s) => s.addDoc);
  const removeDoc = useRelay((s) => s.removeDoc);
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docPhrases, setDocPhrases] = useState("checklist, send me, pdf");

  function saveDoc() {
    if (!docName.trim()) return;
    const doc: VaultDoc = {
      id: uid("doc"),
      name: docName.trim(),
      kind: docUrl.startsWith("http") ? "link" : "note",
      url: docUrl.trim() || `vault://${docName.trim()}`,
      triggerPhrases: docPhrases.split(",").map((s) => s.trim()).filter(Boolean),
    };
    addDoc(doc);
    setDocName("");
    setDocUrl("");
    toast("Vault document armed");
  }

  return (
    <Shell title="Settings">
      {!hydrated ? (
        <div className="h-64 animate-pulse rounded-xl bg-surface" />
      ) : (
        <div className="mx-auto flex max-w-2xl flex-col gap-10">
          <section>
            <h2 className="font-display text-2xl">Node</h2>
            <p className="mt-1 text-sm text-muted">
              Keep this phone awake and the desk stays on. Keys live on-device, never in the repo.
            </p>
            <div className="mt-4 space-y-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <Row
                label="Keep screen awake"
                hint="Uses the Wake Lock API so the node does not sleep."
                checked={settings.keepAwake}
                onCheckedChange={(v) => patchSettings({ keepAwake: v })}
              />
              <Row
                label="Auto-publish"
                hint="Skip review and push when a network token is present."
                checked={settings.autoPublish}
                onCheckedChange={(v) => patchSettings({ autoPublish: v })}
              />
              <Row
                label="Auto-reply comments"
                hint="Sentinel drafts replies as they arrive."
                checked={settings.autoReply}
                onCheckedChange={(v) => patchSettings({ autoReply: v })}
              />
              <Row
                label="Auto-DM promised files"
                hint="Fulfillment sends the vault document when a lead matches."
                checked={settings.autoDm}
                onCheckedChange={(v) => patchSettings({ autoDm: v })}
              />
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl">Voice</h2>
            <Label className="mt-3 block">Brand voice</Label>
            <Textarea
              className="mt-2"
              value={settings.brandVoice}
              onChange={(e) => patchSettings({ brandVoice: e.target.value })}
            />
          </section>

          <section>
            <h2 className="font-display text-2xl">Telegram</h2>
            <p className="mt-1 text-sm text-muted">
              Create a bot with BotFather, paste the token. This phone long-polls getUpdates — no public webhook required.
            </p>
            <div className="mt-4 space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <Row
                label="Arm the bot"
                hint="Ingest videos and captions as desk jobs."
                checked={settings.telegram.enabled}
                onCheckedChange={(v) =>
                  patchSettings({ telegram: { ...settings.telegram, enabled: v } })
                }
              />
              <Field
                label="Bot token"
                value={settings.telegram.botToken}
                secret
                onChange={(v) => patchSettings({ telegram: { ...settings.telegram, botToken: v } })}
                placeholder="123456:AA…"
              />
              <Field
                label="Allowed chat ID"
                value={settings.telegram.allowedChatId}
                onChange={(v) =>
                  patchSettings({ telegram: { ...settings.telegram, allowedChatId: v } })
                }
                placeholder="Optional filter"
              />
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl">Networks</h2>
            <p className="mt-1 text-sm text-muted">
              Grok is already wired for writing. Add each network’s token when you are ready to post and reply for real.
            </p>
            <div className="mt-4 flex flex-col gap-4">
              {(Object.keys(PLATFORM_META) as Platform[]).map((p) => {
                const creds = settings.platforms[p];
                return (
                  <article key={p} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{PLATFORM_META[p].label}</p>
                        <p className="text-xs text-subtle">{hintFor(p)}</p>
                      </div>
                      <Switch
                        checked={creds.enabled}
                        onCheckedChange={(v) => patchPlatform(p, { enabled: v })}
                        aria-label={`Enable ${PLATFORM_META[p].label}`}
                      />
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Field
                        label="API key"
                        value={creds.apiKey}
                        secret
                        onChange={(v) => patchPlatform(p, { apiKey: v })}
                      />
                      <Field
                        label="Access token"
                        value={creds.accessToken}
                        secret
                        onChange={(v) => patchPlatform(p, { accessToken: v })}
                      />
                    </div>
                    <div className="mt-3">
                      <Field
                        label={extraLabel(p)}
                        value={creds.extra}
                        onChange={(v) => patchPlatform(p, { extra: v })}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl">Vault</h2>
            <p className="mt-1 text-sm text-muted">
              Documents the fulfillment agent DMs when a comment matches a trigger phrase.
            </p>
            <ul className="mt-4 space-y-2">
              {docs.map((d) => (
                <li
                  key={d.id}
                  className="flex items-start justify-between gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
                >
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-muted">{d.triggerPhrases.join(" · ")}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeDoc(d.id)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <Field label="Name" value={docName} onChange={setDocName} placeholder="Lead magnet PDF" />
              <Field label="URL or path" value={docUrl} onChange={setDocUrl} placeholder="https://…" />
              <Field
                label="Trigger phrases"
                value={docPhrases}
                onChange={setDocPhrases}
                placeholder="checklist, send me"
              />
              <Button variant="secondary" onClick={saveDoc}>
                Arm document
              </Button>
            </div>
          </section>
        </div>
      )}
    </Shell>
  );
}

function Row({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  secret,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secret?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        className="mt-1.5"
        type={secret ? "password" : "text"}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function hintFor(p: Platform): string {
  if (p === "youtube") return "YouTube Data API key + OAuth access token.";
  if (p === "linkedin") return "Marketing / Community API access token.";
  if (p === "instagram") return "Meta Graph token for an IG business account.";
  return "TikTok Content Posting API token (approved app).";
}

function extraLabel(p: Platform): string {
  if (p === "youtube") return "Channel ID";
  if (p === "linkedin") return "Person URN (urn:li:person:…)";
  if (p === "instagram") return "IG business account ID";
  return "Open ID / extra";
}
