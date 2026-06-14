# Relay Sync — per-agent install

Copy the block for each agent **once per project**. All agents read the same `.relay/relay_context.md`.

---

## Cursor

**Option 1 — Skill (recommended)**  
Copy this folder into the project:

```text
.cursor/skills/relay-sync/
├── SKILL.md
└── agent-install.md
```

Invoke: `@relay-sync` or ask the agent to "relay sync" at session start.

**Option 2 — Rule (auto)**  
Create `.cursor/rules/relay-sync.mdc`:

```markdown
---
description: Load Relay handoff context at session start
globs:
alwaysApply: true
---

At the start of each session in a Relay workspace, read `.relay/relay_context.md`.
If missing, run `node backend/scripts/relay-context.js .` from the OrbitOS backend path or sync via Relay UI.
Use RELAY_CONTEXT for handoff — never paste raw memory.json or agent transcripts.
```

---

## Claude Code

Add to project root `CLAUDE.md` (or include from `AGENTS.md`):

```markdown
## Relay handoff

This project uses Relay. At the start of every session:

1. Read `.relay/relay_context.md` if it exists.
2. Treat it as authoritative context (PROJECT SUMMARY, CURRENT TASKS, OPEN DECISIONS, CONNECTED AGENTS, LAST CHECKPOINT, RELEVANT EVENTS).
3. Do not load full agent transcripts or `.relay/memory.json` unless explicitly asked.

Regenerate: `node path/to/OrbitOS/backend/scripts/relay-context.js "<workspace>"`
```

---

## GitHub Copilot

Create or append `.github/copilot-instructions.md`:

```markdown
# Relay context

When working in this repo, read `.relay/relay_context.md` for project handoff.
Sections: PROJECT SUMMARY, CURRENT TASKS, OPEN DECISIONS, CONNECTED AGENTS, LAST CHECKPOINT, RELEVANT EVENTS.
Do not paste entire chat histories — use RELAY_CONTEXT only.
Update `.relay/current_task.md` and `.relay/decisions.md` when tasks or decisions change.
```

---

## Codex (CLI / VS Code)

Add to project `AGENTS.md` or `.codex/` instructions file:

```markdown
## Relay

Read `.relay/relay_context.md` at session start for cross-agent context.
Never attach full `.relay/memory.json` or rollout JSONL for handoff.
Sync context: `node <orbitos>/backend/scripts/relay-context.js "<workspace>"`
```

For one-shot CLI context:

```bash
codex -q "$(cat .relay/relay_context.md)"
```

---

## Antigravity IDE

Add a workspace rule or pin `.relay/relay_context.md` as context artifact.

**Minimal rule text:**

```markdown
Before planning, read `.relay/relay_context.md` (RELAY_CONTEXT).
Use PROJECT SUMMARY, CURRENT TASKS, OPEN DECISIONS, CONNECTED AGENTS, LAST CHECKPOINT, RELEVANT EVENTS.
Do not ingest full brain transcripts for handoff.
After major progress, update `.relay/current_task.md` and run Relay sync.
```

**Beacon file (optional):**  
Write `.relay/.read_on_start` containing:

```text
relay_context.md
```

---

## Quick setup checklist (any project)

```text
[ ] Register workspace in Relay UI (creates .relay/)
[ ] Connect agents used on this project
[ ] Sync Memory
[ ] Fill .relay/project.md, current_task.md, decisions.md
[ ] Install agent hook above for each tool you use
[ ] Verify .relay/relay_context.md exists and is < ~10 KB
```
