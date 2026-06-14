# Decisions

## Open
- [ ] Weekend hero feature: full Conductor loop (think+decide+act+verify) vs collision detection first
- [ ] Live demo dispatch: rely on real Claude/Codex CLI vs deterministic replay/mock
- [ ] Whether to auto-open browser on `relay init` (currently prints URLs only)

## Resolved

- 2026-06-15 — `relay-os@0.1.0` published successfully to the public npm registry; landing page get-started section (`landing/index.html`) now documents `npm install -g relay-os` + `relay init/sync/context` and links to npmjs.com/package/relay-os
- 2026-06-14 — Agent-facing instructions (CLAUDE.md, AGENTS.md, .cursorrules, copilot-instructions.md, relay.mdc, skills, hook libs, README/QUICKSTART) now tell agents to use the local `relay` npm binary (`relay init`, `relay sync`, `relay context .`) instead of `npx relay-os`; `npx relay` kept only as fallback if `relay` isn't on PATH
- 2026-06-15 — Keep npm package name as `relay-os` (considered renaming to `relay-brain`, available but decided against — no rename)
- 2026-06-15 — Install/distribution: publish `relay-os` to the public npm registry (chosen over GitHub-install-only); `npx github:AspiringPianist/OrbitOS` remains a working fallback
- 2026-06-15 — Added `LICENSE` (MIT, Krishna Sai) referenced by README; `npm pack --dry-run` confirms a clean ~4.1MB/720-file tarball
- 2026-06-14 — Reframe for hackathon: position OrbitOS as an **autonomous orchestration control plane** (Conductor) on top of the shipped Relay memory substrate; agentic layer is additive, no rewrite
- 2026-06-14 — Build the cockpit in `mission-control/` (Next.js, :6374); `basic_frontend/` (express static, :3001) is legacy
- 2026-06-14 — Reuse existing primitives: `spawnSync('claude'/'codex')` for dispatch, `relayCompileIr.callLlm` for reasoning, `memory.timeline` for monitoring/collision
- 2026-06-14 — Mission Control is **local-only**; removed NextAuth, MongoDB, GitHub OAuth, team group chat
- 2026-06-14 — `relay init` starts Mission Control + API in **background**; `--no-serve` to skip
- 2026-06-14 — `relay watch` = sync + compile only; `relay refresh` adds `relay context`
- 2026-06-14 — Mission Control **Agent chat** = team notes + launch hints, not embedded IDE agents
- 2026-06-14 — Collaborators + chat stored in `.relay/mission_control.json`
- 2026-06-14 — IR files surfaced in sidebar **Relay brain** panel + **All IR files** tab
- 2026-06-14 — npm package ships mission-control; postinstall installs UI deps
- 2026-06-14 — Optional MCP documented per agent; always set `RELAY_WORKSPACE_PATH`
- 2026-06-14 — No MongoDB/Redis; optional system `sqlite3` CLI only (not npm)
