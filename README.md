# OrbitOS

OrbitOS is a small multi-app workspace for collecting, viewing, and experimenting with agent conversations.

## Repository layout

- `backend/` - Express relay API that reads local agent session files and writes normalized memory.
- `basic_frontend/` - Static HTML/CSS/JS UI for registering a workspace, connecting agents, and browsing memory.
- `mission-control/` - Next.js app for the larger control-plane UI.
- `landing/` - Static landing-page assets and experiments.
- `copilot.md`, `claude_code.md`, `codex_cli.md`, `antigravity.md` - agent-specific notes and extraction references.

## Quick start

### Backend relay

```bash
cd backend
npm install
npm start
```

The relay runs on `http://localhost:3001`.

### Basic frontend

Open `basic_frontend/index.html` in a browser after the backend is running.

### Mission control

```bash
cd mission-control
npm install
npm run dev
```

The Next.js app runs on `http://localhost:6374`.

## What it does

- Registers a workspace
- Connects supported agents
- Normalizes conversation history into relay memory
- Shows a unified timeline across agents

## Notes

This repo contains some scratch and planning documents at the root. The `.gitignore` keeps common local-only files, build output, and dependency folders out of future commits.
