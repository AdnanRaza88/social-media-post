import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Shell } from "@/components/shell";
import { MCP_TOOLS } from "@/lib/mcp/catalog";
import { AGENT_META } from "@/lib/playbooks";
import { useRelay } from "@/lib/store";
import { useEnsureHydrated } from "@/lib/use-hydrated";
import { AGENTS, type AgentId } from "@/lib/types";

export const Route = createFileRoute("/agents")({ component: Agents });

function Agents() {
  const hydrated = useEnsureHydrated();
  const jobs = useRelay((s) => s.jobs);
  const latest = jobs[0];

  return (
    <Shell title="Agents">
      <p className="max-w-xl text-sm text-muted">
        Eight specialists share one MCP tool belt. The phone is the node: Telegram ingest, comment watch, and fulfillment all run here while the screen is awake.
      </p>

      {!hydrated ? (
        <div className="mt-6 h-48 animate-pulse rounded-xl bg-surface" />
      ) : (
        <>
          <section className="mt-8 grid gap-3 sm:grid-cols-2">
            {AGENTS.map((id) => {
              const stage = latest?.stages.find((s) => s.agent === id);
              return (
                <article key={id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{AGENT_META[id].label}</p>
                      <p className="mt-1 text-sm text-muted">{AGENT_META[id].role}</p>
                    </div>
                    <Badge tone={stage?.status === "done" ? "live" : stage?.status === "running" ? "fg" : "muted"}>
                      {stage?.status ?? "idle"}
                    </Badge>
                  </div>
                  {stage?.tool ? (
                    <p className="mt-3 font-mono text-[11px] text-subtle">{stage.tool}</p>
                  ) : null}
                </article>
              );
            })}
          </section>

          <section className="mt-10">
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-subtle">MCP tools</h2>
            <ul className="mt-3 divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
              {MCP_TOOLS.map((tool) => (
                <li key={tool.name} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <p className="font-mono text-sm">{tool.name}</p>
                    <p className="text-sm text-muted">{tool.description}</p>
                  </div>
                  <p className="text-[11px] uppercase tracking-wider text-subtle">
                    {AGENT_META[tool.agent as AgentId]?.label}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </Shell>
  );
}
