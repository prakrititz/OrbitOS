# Current Tasks

<!-- Maintained by relay compile. -->

## In progress
- [x] Audit existing codebase to find insertion points for an agentic layer
- [x] Define winning hackathon strategy (autonomous-orchestration reframe)
- [x] Write 15-slide pitch deck content → `docs/PITCH.md`
- [x] Add missing `LICENSE` (MIT) and include it in `package.json` `files`
- [ ] Decide weekend hero feature: full Conductor loop vs collision detection first
- [x] User ran `npm login` (account: jester1177)
- [x] npm publish `relay-os@0.1.0` — package is live on the public npm registry
- [x] Add npm install instructions (`npm install -g relay-os`, `relay init/sync/context`) + link to npmjs.com/package/relay-os to `landing/index.html` get-started section

## Next
- [ ] Build Conductor vertical slice (reuses existing spawn + callLlm + timeline):
      `relay conduct "<goal>"` → decompose → route → dispatch → monitor → verify
- [ ] Add `lib/relayCollision.js` (groupBy(path) over `memory.timeline`)
- [ ] Add `POST /api/orchestrate` + MCP tools (`relay_dispatch`, `relay_conflicts`)
- [ ] Cockpit panel in `mission-control/` (DAG + live status + collision alerts)
- [ ] Deterministic replay mode for a fail-safe stage demo
- [ ] Verify `relay init` background serve on a fresh machine
- [ ] After `npm login`: run `npm publish` for `relay-os@0.1.0` (confirm with user first)
