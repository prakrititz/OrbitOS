# Architecture

## Layout

- `bin/relay.js` — CLI entry / verb dispatch (add new verbs like `conduct` here)
- `backend/relay.js` — sync, watch, connect, register + agent discovery + **spawn primitive** (`spawnSync` claude/codex)
- `backend/parsers/*` — per-agent transcript harvesters → normalized events
- `backend/lib/timeline.js` — `buildGlobalTimeline()` merges agents into one sorted event log
- `backend/lib/relayCompileIr.js` — `callLlm()` provider-agnostic LLM (reuse for decompose/route/verify)
- `backend/lib/relayStore.js` — path-guarded `.relay/` file read/write
- `backend/server.js` — Express API (:3001); add new routes in `createApp()`
- `backend/mcp/server.js` — MCP stdio server; add tools to `TOOLS[]` + `callTool` switch
- `backend/lib/relayServe.js` — foreground/background serve orchestration
- `backend/lib/relayUi.js` — spawns Next.js Mission Control (:6374)
- `backend/lib/relayMeta.js` — `.relay/mission_control.json` (collaborators, chat)
- `mission-control/` — Next.js dashboard / cockpit (:6374) — the real UI
- `basic_frontend/` — legacy static UI served by express (:3001)
- `~/.relay-os/projects.json` — project registry + API keys

## Event schema (substrate for the agentic layer)

`{ ts, kind: message|code_edit|artifact|checkpoint, role, content, source, file, path, action, summary, diff }`
stored in `.relay/memory.json` → `{ agents: { [name]: { events[] } }, timeline: [] }`.

## Planned agentic layer (additive — no rewrite)

- `lib/relayOrchestrator.js` — Conductor: decompose → route → dispatch → monitor → verify
- `lib/relayCollision.js` — pure fn over `memory.timeline`: groupBy(path) + overlapping windows + diff-hunk overlap
- Surfaces: CLI `relay conduct`, `POST /api/orchestrate`, MCP `relay_dispatch`/`relay_conflicts`, cockpit panel

## Hooks (`backend/lib/relayHooks.js`, `backend/hooks/relay-hook-lib.js`)

- Per-agent stop hooks run `relay sync` + `relay compile` automatically
- Cursor install must use `node ".relay/hooks/relay-cursor-stop.js"` (see `HOOK_CMD.cursor`)
- Follow-up IR merge is agent-driven today; target: hook also runs `compile-ir` + `context` without Agent mode

## Planned change capture

- `.relay/changes/` — relay-owned before/after snapshots (git-lite), not dependent on agent transcripts or hook follow-up

## Boundaries

- Sync/compile: Relay CLI (`watch`, stop hooks)
- IR markdown updates: session agent (or `/relay update`); moving toward `compile-ir` in hook
- Handoff: `relay context` → `relay_context.md`
- Storage is files only (`.relay/`); pluggable toward Postgres/object store for teams
- Local-first by design (privacy); event-sourced core gives audit + replay for free
- Mission Control reads API; the Conductor (not the browser) executes/dispatches agents
