# Failures & Anti-patterns

<!-- What failed or what NOT to repeat -->

- Duplicate `uiPort` declaration in `server.js` crashed API start — fixed; smoke-test after serve changes
- Background `relay serve` test interrupted in terminal — not a code bug; use health check on port
- Mission Control IR empty when API offline — UI now shows explicit “run relay serve / relay init” hint
- Do not expect Cursor/Copilot/Antigravity agents to run from Mission Control browser — IDE/CLI required
- `relay mcp` cwd is backend unless `RELAY_WORKSPACE_PATH` is set — document in MCP config
- 2026-06-15 — `npm publish` for `relay-os@0.1.0` failed with 403: npm account requires 2FA or a granular access token with "bypass 2FA for write" to publish. Must enable 2FA on npmjs.com or create such a token before retrying `npm publish`.
- 2026-06-15 — Second `npm publish` attempt: registry still 404 for `relay-os` (not published) — output got cut off before the final error, likely same 403/2FA issue. `npm pkg fix` needed: `package.json` has `bin.relay: "./bin/relay.js"` (leading `./`) and `repository.url` without `git+` prefix, both auto-corrected by npm at publish time but not on disk.
- 2026-06-15 — User's real `npm publish` tarball listing included `backend/node_modules/*` despite `.npmignore` excluding `backend/node_modules/`; `npm pack --dry-run` from both Bash and PowerShell in this session correctly excluded it (721 files/4.1MB) — cause of discrepancy unresolved, re-check before next publish attempt.
- Cursor stop hook on Windows ran `.relay/hooks/relay-cursor-stop.js` without `node` — file opened in editor instead of executing; fixed in `backend/lib/relayHooks.js` `installCursorHooks`
- Stop hook IR follow-up fails in **Ask mode** (read-only) — hooks only auto-run `sync` + `compile`; IR markdown update needs Agent mode, terminal `relay compile-ir .`, or hook wiring for agent-free path
- Do not rely on stop hooks firing every message — skip conditions (`loop_count`, `fullyIdle`, continuation marker) and uneven agent support (Copilot IDE often has no hook)
