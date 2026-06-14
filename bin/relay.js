#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PACKAGE_ROOT = path.join(__dirname, '..');
const BACKEND = path.join(PACKAGE_ROOT, 'backend');

function loadRelay() {
  return require(path.join(BACKEND, 'relay.js'));
}

function loadRelayContext() {
  return require(path.join(BACKEND, 'lib', 'relayContext.js'));
}

function resolveWorkspace(argPath) {
  return path.resolve(argPath || process.cwd());
}

function printHelp() {
  console.log(`
Relay — cross-agent project memory

Usage:
  relay init [path]           Create .relay/ + auto-install all agent hooks
  relay install [path]        Re-run agent hook install (idempotent)
  relay serve [--port 3001]   Start Relay API + Mission Control UI
  relay serve --api-only      API only (no Next.js UI)
  relay sync [path]           Harvest agent transcripts → memory.json
  relay compile [path]        Brief for IR update (internal)
  relay compile-ir [path]     Deprecated — use session agent + compile brief
  relay context [path]        Generate relay_context.md handoff
  relay refresh [path]        sync + compile brief + context (agent updates IR)
  relay watch [path]          Background sync for all agents
  relay mcp                   MCP server for .relay file access (stdio)
  relay open                  Print UI URL

Options:
  --help, -h
  --print                     With context: print markdown to stdout
  --skip-ir                   With refresh: skip IR update
  --llm-only                  With compile-ir: require LLM (fail without API key)

Examples:
  npx relay-os init
  npx relay-os serve
  npx relay-os refresh .

Agents: read .relay/AGENT_BOOTSTRAP.md (also RELAY.md at project root)

Docs: docs/QUICKSTART.md
`);
}

function parseArgs(argv) {
  const args = [...argv];
  const flags = {};
  const positional = [];

  while (args.length) {
    const a = args.shift();
    if (a === '--help' || a === '-h') flags.help = true;
    else if (a === '--print') flags.print = true;
    else if (a === '--skip-ir') flags.skipIr = true;
    else if (a === '--llm-only') flags.llmOnly = true;
    else if (a === '--port') flags.port = Number(args.shift());
    else if (a.startsWith('--port=')) flags.port = Number(a.split('=')[1]);
    else if (a === '--ui-port') flags.uiPort = Number(args.shift());
    else if (a.startsWith('--ui-port=')) flags.uiPort = Number(a.split('=')[1]);
    else if (a === '--api-only') flags.apiOnly = true;
    else if (a.startsWith('-')) args.unshift(a);
    else positional.push(a);
  }

  return { flags, positional, command: positional[0] };
}

function ensureRelayDir(workspacePath) {
  const relayDir = path.join(workspacePath, '.relay');
  if (!fs.existsSync(relayDir)) {
    console.error('Relay not initialized. Run: npx relay-os init');
    process.exit(1);
  }
}

function cmdInit(workspacePath) {
  const { registerWorkspace } = loadRelay();
  const { writeRelayContext } = loadRelayContext();
  const { registerProject } = require(path.join(BACKEND, 'lib', 'relayProjects'));

  registerWorkspace(workspacePath);
  writeRelayContext(workspacePath);
  const { project, manifest } = registerProject(workspacePath);

  const uiPort = Number(process.env.RELAY_UI_PORT) || 6374;
  const dashboardUrl = manifest.dashboardUrl || `http://localhost:${uiPort}/?project=${project.id}`;
  const setupUrl = manifest.setupUrl || `http://localhost:${uiPort}/?setup=${project.id}`;

  console.log('✓ Relay initialized + agent hooks installed automatically');
  console.log(`  ${path.join(workspacePath, '.relay')}`);
  console.log(`  ${path.join(workspacePath, 'RELAY.md')}`);
  console.log(`  ${path.join(workspacePath, '.relay', 'AGENT_BOOTSTRAP.md')}`);
  console.log('');
  console.log('  Patched: CLAUDE.md, AGENTS.md, .github/copilot-instructions.md, .cursorrules');
  console.log('  Hooks: Cursor, Claude, Codex, Copilot, Antigravity → agent updates IR');
  console.log('  Sync:  relay watch .');
  console.log('');
  console.log('  ── Project dashboard ──');
  console.log(`  Open:     ${dashboardUrl}`);
  console.log(`  Setup:    ${setupUrl}`);
  console.log(`  API key:  ${project.apiKey}`);
  console.log('');
  console.log('  Save this API key — agents and MCP use it to access this project.');
  console.log('  Run `relay serve` for Mission Control + API. Customize name in the dashboard.');
}

function cmdInstall(workspacePath) {
  const { installRelayWorkspace, isRelayInstalled } = loadRelay();
  if (!isRelayInstalled(workspacePath)) {
    cmdInit(workspacePath);
    return;
  }
  const result = installRelayWorkspace(workspacePath, { packageRoot: PACKAGE_ROOT });
  console.log('✓ Agent hooks refreshed');
  console.log(`  ${result.paths.bootstrap}`);
  console.log(`  files: ${result.manifest.instructionFiles.join(', ')}`);
}

function cmdSync(workspacePath) {
  ensureRelayDir(workspacePath);
  const { syncWorkspace } = loadRelay();
  const result = syncWorkspace(workspacePath);
  console.log(`✓ Synced ${result.totalEvents} events (${result.timelineCount} in timeline)`);
}

function cmdCompile(workspacePath) {
  ensureRelayDir(workspacePath);
  const { writeCompileBrief } = loadRelayContext();
  const result = writeCompileBrief(workspacePath);
  console.log(`✓ Compile brief → ${result.paths.markdown}`);
  console.log(`  ${result.brief.timelineSampleCount} timeline events`);
}

async function cmdCompileIr(workspacePath, flags) {
  ensureRelayDir(workspacePath);
  const { compileIr } = loadRelay();
  const { resolveLlmConfig } = require(path.join(BACKEND, 'lib', 'relayCompileIr'));
  const config = resolveLlmConfig(workspacePath);

  if (flags.llmOnly && (!config.enabled || !config.apiKey)) {
    console.error('No LLM API key. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or RELAY_LLM_API_KEY');
    process.exit(1);
  }

  const result = await compileIr(workspacePath);
  if (result.method === 'llm') {
    console.log(`✓ IR updated via LLM (${result.provider}/${result.model})`);
    console.log(`  files: ${result.files.join(', ')}`);
  } else {
    console.log(`✓ IR updated via heuristics (no API key)`);
    console.log(`  ${result.message}`);
    console.log('  Tip: set OPENAI_API_KEY for smarter IR updates');
  }
}

function cmdContext(workspacePath, flags) {
  ensureRelayDir(workspacePath);
  const { writeRelayContext } = loadRelayContext();
  const result = writeRelayContext(workspacePath);
  if (flags.print) {
    process.stdout.write(result.markdown);
    return;
  }
  console.log(`✓ RELAY_CONTEXT → ${result.paths.markdown}`);
}

async function cmdRefresh(workspacePath, flags) {
  ensureRelayDir(workspacePath);
  const { refreshWorkspace } = loadRelay();
  const result = await refreshWorkspace(workspacePath, { skipBrief: flags.skipIr });
  console.log(`✓ Synced ${result.sync.totalEvents} events (${result.sync.timelineCount} in timeline)`);
  if (!flags.skipIr) {
    console.log('✓ compile_brief.md ready — session agent updates IR (Cursor/Claude: stop hook)');
  }
  console.log(`✓ RELAY_CONTEXT → ${result.context.paths.markdown}`);
}

async function cmdWatch(workspacePath) {
  ensureRelayDir(workspacePath);
  const { startRelayWatch } = loadRelay();
  const result = await startRelayWatch(workspacePath);
  console.log(`✓ Relay watch active (${result.watcherCount} transcript paths)`);
  console.log('  Syncs memory + compile_brief.md — session agent updates IR via stop hooks');
  console.log('  Ctrl+C to stop');
}

function cmdMcp() {
  const mcpPath = path.join(BACKEND, 'mcp', 'server.js');
  spawn(process.execPath, [mcpPath], {
    stdio: 'inherit',
    env: process.env,
    cwd: BACKEND,
  });
}

function cmdServe(flags) {
  const port = flags.port || Number(process.env.RELAY_PORT) || 3001;
  const uiPort = flags.uiPort || Number(process.env.RELAY_UI_PORT) || 6374;
  const { startMissionControlUi } = require(path.join(BACKEND, 'lib', 'relayUi'));
  const serverPath = path.join(BACKEND, 'server.js');
  const env = { ...process.env, RELAY_PORT: String(port), RELAY_UI_PORT: String(uiPort) };

  let uiChild = null;
  if (!flags.apiOnly) {
    try {
      uiChild = startMissionControlUi({ apiPort: port, uiPort });
    } catch (err) {
      console.warn(`Mission Control UI failed to start: ${err.message || err}`);
      console.warn('Continuing with API only. Retry after: npm install (in relay-os package root)');
    }
  }

  const apiChild = spawn(process.execPath, [serverPath], {
    stdio: 'inherit',
    env,
    cwd: BACKEND,
  });

  function shutdown() {
    if (uiChild && !uiChild.killed) uiChild.kill();
    if (apiChild && !apiChild.killed) apiChild.kill();
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  if (uiChild) {
    uiChild.on('exit', (code) => {
      if (code && code !== 0) console.warn(`Mission Control exited (${code})`);
    });
  }
}

function cmdOpen(flags) {
  const port = flags.port || Number(process.env.RELAY_PORT) || 3001;
  const uiPort = flags.uiPort || Number(process.env.RELAY_UI_PORT) || 6374;
  console.log(`Mission Control: http://localhost:${uiPort}/`);
  console.log(`Relay API:       http://localhost:${port}/api/health`);
}

async function main() {
  const { flags, positional, command } = parseArgs(process.argv.slice(2));

  if (flags.help || !command || command === 'help') {
    printHelp();
    return;
  }

  const wsCommands = ['init', 'install', 'sync', 'compile', 'compile-ir', 'context', 'refresh', 'watch'];
  const workspacePath = resolveWorkspace(
    wsCommands.includes(command) ? positional[1] : undefined
  );

  switch (command) {
    case 'init':
      cmdInit(resolveWorkspace(positional[1]));
      break;
    case 'install':
      cmdInstall(resolveWorkspace(positional[1]));
      break;
    case 'sync':
      cmdSync(resolveWorkspace(positional[1]));
      break;
    case 'compile':
      cmdCompile(resolveWorkspace(positional[1]));
      break;
    case 'compile-ir':
      await cmdCompileIr(resolveWorkspace(positional[1]), flags);
      break;
    case 'context':
      cmdContext(resolveWorkspace(positional[1]), flags);
      break;
    case 'refresh':
      await cmdRefresh(resolveWorkspace(positional[1]), flags);
      break;
    case 'watch':
      await cmdWatch(resolveWorkspace(positional[1]));
      break;
    case 'skill':
      cmdInstall(resolveWorkspace(positional[1]));
      break;
    case 'serve':
    case 'start':
      cmdServe(flags);
      break;
    case 'open':
    case 'ui':
      cmdOpen(flags);
      break;
    case 'mcp':
      cmdMcp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
