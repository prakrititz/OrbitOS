**Relay**  
*One project brain. Any coding agent.*



Git tracks your code. Relay tracks your **project intelligence** — tasks, decisions, failures, and what every agent did last session.  
Switch tools without re-explaining the repo.

---

## Why Relay

Every coding agent wants its own instruction file — `CLAUDE.md`, `.cursorrules`, `copilot-instructions.md`, and so on. Relay patches them automatically and keeps **one shared `.relay/` brain** in sync across:


| Cursor | Claude Code | GitHub Copilot | Codex | Antigravity |
| ------ | ----------- | -------------- | ----- | ----------- |


**One install** gives you the CLI, stop hooks, agent prompts, relay-sync skill, `.relay/` scaffolding, Mission Control UI, and an optional MCP server.

---

## Quick start

```bash
cd your-project
relay init          # .relay/, hooks, prompts, API key
relay serve         # Mission Control → :6374  ·  API → :3001
relay watch .       # background sync (keep running)
```

Work in any agent. Stop hooks (or `/relay update`) refresh IR markdown. Switch agents → `/relay context` or read `.relay/relay_context.md`.

**Install options**


| Method    | Command                                                   |
| --------- | --------------------------------------------------------- |
| npm       | `relay init`                                              |
| local dev | `npm i and then npm link` in this repo, then `relay init` |
| GitHub    | `npx github:AspiringPianist/OrbitOS init`                 |


Requires **Node.js 18+**. No database. First `relay serve` installs Mission Control deps automatically.



---

## How it works

```text
  Cursor ──┐
  Claude ──┤   stop hooks + watch     ┌─────────────┐
  Copilot ─┼──► sync ──► memory.json ─►│  .relay/    │──► relay_context.md
  Codex ───┤         compile_brief     │  IR .md     │         │
  Antigravity ┘      (agent updates)   └─────────────┘         ▼
                                                          next agent reads handoff
```


| Layer         | Who runs it                            | Output                          |
| ------------- | -------------------------------------- | ------------------------------- |
| **Sync**      | `relay watch`, stop hook, `relay sync` | `memory.json` + timeline        |
| **Compile**   | same                                   | `compile_brief.md`              |
| **IR update** | **you / the session agent**            | `project.md`, `decisions.md`, … |
| **Handoff**   | `relay context`                        | `relay_context.md`              |


`relay watch` = sync + compile only. `relay refresh` = sync + compile + context.

---

## What `relay init` creates

```text
your-project/
├── .relay/
│   ├── AGENT_BOOTSTRAP.md       ← read every session
│   ├── relay_context.md         ← handoff file
│   ├── compile_brief.md         ← agent reads to update IR
│   ├── project.md · current_task.md · decisions.md · failures.md
│   ├── memory.json              ← unified timeline
│   ├── project.json             ← API key + dashboard URL
│   └── hooks/
├── RELAY.md
├── CLAUDE.md · AGENTS.md · .github/copilot-instructions.md · .cursorrules
├── .cursor/hooks.json + .cursor/skills/relay-sync/
├── .claude/settings.json · .codex/hooks.json · .agents/hooks.json
```

Registry (all projects): `~/.relay-os/projects.json`

---

## Commands


| Command                | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `relay init [path]`    | Scaffold `.relay/`, hooks, agent patches, API key |
| `relay install [path]` | Re-apply hooks after upgrade                      |
| `relay serve`          | Mission Control (:6374) + API (:3001)             |
| `relay watch [path]`   | Background sync + compile                         |
| `relay sync [path]`    | Harvest transcripts → `memory.json`               |
| `relay compile [path]` | Write `compile_brief.md`                          |
| `relay context [path]` | Generate `relay_context.md`                       |
| `relay refresh [path]` | sync + compile + context                          |
| `relay mcp`            | MCP server (stdio) — optional                     |
| `relay open`           | Print UI + API URLs                               |


**Pseudo-commands** (patched into agent instructions — not native slash commands):


| Say              | Agent does                                     |
| ---------------- | ---------------------------------------------- |
| `/relay update`  | sync → compile → update IR → `relay context .` |
| `/relay context` | read `.relay/relay_context.md`                 |
| `/relay init`    | run `relay init` if missing                    |


Terminal shortcut: `relay refresh .` ≈ `/relay update`

---

## Mission Control

Started by `relay serve` — no login, runs locally.


|           | URL                                                                  |
| --------- | -------------------------------------------------------------------- |
| Dashboard | [http://localhost:6374](http://localhost:6374)                       |
| API       | [http://localhost:3001/api/health](http://localhost:3001/api/health) |


Activity timeline across all agents, live IR markdown, per-project API keys.

---

## MCP (optional)

Give agents **direct tool access** to `.relay/` — list files, read/write IR markdown, sync, fetch handoff.

**Tools exposed:** `relay_list_files` · `relay_read_file` · `relay_write_file` · `relay_get_context` · `relay_sync`

Hooks + pseudo-commands are enough for most workflows. MCP is for agents where you want structured file tools on top.

### 1. Get your paths

After `relay init`, note:

- **Project path** — absolute path to your repo
- **API key** — printed at init (also in `.relay/project.json`) — only needed for remote mode

### 2. Base config

Always set `RELAY_WORKSPACE_PATH` to your project root (required — MCP may not inherit the right cwd):

```json
"env": {
  "RELAY_WORKSPACE_PATH": "/absolute/path/to/your-project"
}
```

**Local mode** (reads/writes `.relay/` on disk — default):

```json
{
  "command": "npx",
  "args": ["-y", "relay-os", "mcp"],
  "env": {
    "RELAY_WORKSPACE_PATH": "/absolute/path/to/your-project"
  }
}
```

If `relay` is on your PATH (`npm link` / global install):

```json
{
  "command": "relay",
  "args": ["mcp"],
  "env": {
    "RELAY_WORKSPACE_PATH": "/absolute/path/to/your-project"
  }
}
```

**Remote mode** (via `relay serve` API — useful when UI/API is already running):

```json
{
  "command": "npx",
  "args": ["-y", "relay-os", "mcp"],
  "env": {
    "RELAY_WORKSPACE_PATH": "/absolute/path/to/your-project",
    "RELAY_API_URL": "http://localhost:3001",
    "RELAY_API_KEY": "relay_your_key_from_init"
  }
}
```

### 3. Register per agent

**Cursor** — `.cursor/mcp.json` (project) or user MCP settings

```json
{
  "mcpServers": {
    "relay": {
      "command": "npx",
      "args": ["-y", "relay-os", "mcp"],
      "env": {
        "RELAY_WORKSPACE_PATH": "/absolute/path/to/your-project"
      }
    }
  }
}
```

Restart Cursor or reload MCP. Relay tools appear in Agent mode.



**Claude Code** — `.mcp.json` (project) or `~/.claude.json`

```json
{
  "mcpServers": {
    "relay": {
      "command": "npx",
      "args": ["-y", "relay-os", "mcp"],
      "env": {
        "RELAY_WORKSPACE_PATH": "/absolute/path/to/your-project"
      }
    }
  }
}
```

Or via CLI: `claude mcp add relay -- npx -y relay-os mcp` (set env in config after).



**GitHub Copilot** — VS Code `.vscode/mcp.json` or Copilot CLI MCP config

VS Code / Copilot (`mcp.json`):

```json
{
  "servers": {
    "relay": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "relay-os", "mcp"],
      "env": {
        "RELAY_WORKSPACE_PATH": "${workspaceFolder}"
      }
    }
  }
}
```

Copilot CLI — add to your MCP config file per [Copilot MCP docs](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp):

```json
{
  "mcpServers": {
    "relay": {
      "command": "npx",
      "args": ["-y", "relay-os", "mcp"],
      "env": {
        "RELAY_WORKSPACE_PATH": "/absolute/path/to/your-project"
      }
    }
  }
}
```



**Codex CLI** — `~/.codex/config.toml` or project config

```toml
[mcp_servers.relay]
command = "npx"
args = ["-y", "relay-os", "mcp"]

[mcp_servers.relay.env]
RELAY_WORKSPACE_PATH = "/absolute/path/to/your-project"
```



**Antigravity** — MCP settings (same JSON shape as Cursor)

```json
{
  "mcpServers": {
    "relay": {
      "command": "npx",
      "args": ["-y", "relay-os", "mcp"],
      "env": {
        "RELAY_WORKSPACE_PATH": "/absolute/path/to/your-project"
      }
    }
  }
}
```



### Test MCP

```bash
# Should print: relay-mcp started (local mode, workspace: ...)
RELAY_WORKSPACE_PATH=/path/to/project relay mcp
```

---

## Example: three agents, one portfolio

**Day 1 — Cursor** builds the hero. Stop hook runs. You type `/relay update`.

`.relay/current_task.md`:

```markdown
## Now
- Hero done (gradient + CTA)
- Next: projects grid
```

**Day 2 — Claude Code** opens the same folder. `/relay context` → implements grid without re-briefing.

**Day 3 — Copilot CLI** fixes form validation, appends to `.relay/failures.md`.

With `relay serve` + `relay watch .` running, Mission Control shows all three agents on one timeline.

**Switch checklist:** `/relay update` → open same folder in new tool → `/relay context`

---

## Dependencies


|                       |                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Required**          | Node.js 18+, npm                                                                                                               |
| **Auto-installed**    | `express`, `cors` (API) · `next`, `react` (Mission Control)                                                                    |
| **Not needed**        | MongoDB, Redis, Docker, login/OAuth                                                                                            |
| **Optional**          | `[sqlite3` CLI](https://sqlite.org/download.html) on PATH — richer Copilot sync via VS Code `state.vscdb` (not an npm package) |
| **Optional LLM keys** | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` for smarter `relay compile-ir` (heuristics work without)                                |


**Storage:** `.relay/` in your project + `~/.relay-os/projects.json` — files only, no DB server.

**Env vars:** `RELAY_PORT` (3001) · `RELAY_UI_PORT` (6374) · `RELAY_API_KEY` (optional API auth) · `RELAY_SKIP_UI_INSTALL=1`

---

## Stop hooks

Installed in your **project folder** by `relay init`:


| Agent       | Config                        |
| ----------- | ----------------------------- |
| Cursor      | `.cursor/hooks.json`          |
| Claude Code | `.claude/settings.json`       |
| Codex       | `.codex/hooks.json`           |
| Copilot CLI | `.github/hooks/relay-os.json` |
| Antigravity | `.agents/hooks.json`          |


Disable: `.relay/config.json` → `"autoAgentUpdate": false`

---

## Docs

[docs/QUICKSTART.md](docs/QUICKSTART.md)

---

Git tracks code. Relay tracks what your agents know about the project.