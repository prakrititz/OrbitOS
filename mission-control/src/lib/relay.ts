// Typed client for the Relay companion backend (../../backend/server.js).
//
// Relay is a LOCAL-machine service: it watches the user's coding-agent transcripts
// and writes a `.relay/` folder inside the registered workspace path. Because it
// lives on the user's own machine, every call here is made CLIENT-SIDE from the
// browser (so it hits `localhost` on that user's machine), exactly like the
// reference UI in `basic_frontend/index.html`.

export const RELAY_URL =
  process.env.NEXT_PUBLIC_RELAY_URL || 'http://localhost:3001';

// The five agents Relay knows how to discover. `id` MUST match the string the
// backend switches on (see backend/relay.js sendHandshake/connectAgent).
export type AgentId =
  | 'Antigravity'
  | 'Codex'
  | 'Claude Code'
  | 'GitHub Copilot'
  | 'Cursor';

export interface AgentMeta {
  id: AgentId;
  label: string;
  logo: string;
  desc: string;
}

export const AGENTS: AgentMeta[] = [
  { id: 'Claude Code', label: 'Claude Code', logo: '/logos/Claude.png', desc: 'Anthropic Claude Code CLI' },
  { id: 'Codex', label: 'Codex', logo: '/logos/Codex.png', desc: 'OpenAI Codex CLI agent' },
  { id: 'GitHub Copilot', label: 'Copilot', logo: '/logos/github-copilot.png', desc: 'GitHub Copilot sessions' },
  { id: 'Cursor', label: 'Cursor', logo: '/logos/cursor.png', desc: 'Cursor agent transcripts' },
  { id: 'Antigravity', label: 'Antigravity', logo: '/logos/antigravity.png', desc: 'Antigravity IDE agent' },
];

export type EventKind = 'message' | 'code_edit' | 'artifact';

export interface RelayEvent {
  source?: string;        // agent name
  role?: 'user' | 'assistant' | string;
  kind?: EventKind;
  content?: string;
  file?: string;
  path?: string;
  summary?: string;
  diff?: string;
  ts?: string;
}

export interface RelayArtifact {
  name: string;
  content: string;
  metadata?: string;
  source?: string;
}

export interface RelayTask {
  id: string;
  preview: string;
  source?: string;
}

export interface RelayMessage {
  type?: string;
  payload?: unknown;
  source?: string;
}

export interface RelayAgentMemory {
  status: 'connected' | 'handshaking' | 'idle' | 'error';
  transcriptPath?: string;
  eventCount?: number;
  events?: RelayEvent[];
  artifacts?: RelayArtifact[];
  tasks?: RelayTask[];
  messages?: RelayMessage[];
}

export interface RelayMemory {
  workspace: string;
  lastSync: string | null;
  agents: Partial<Record<AgentId, RelayAgentMemory>>;
  timeline: RelayEvent[];
}

async function relayFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${RELAY_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    });
  } catch {
    throw new Error(
      `Relay backend offline at ${RELAY_URL}. Start it with: node backend/server.js`,
    );
  }
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok || data.ok === false) {
    throw new Error((data.error as string) || `Relay request failed (${res.status})`);
  }
  return data as T;
}

/** Create the `.relay/` folder + config/memory inside a local workspace path. */
export function registerWorkspace(workspacePath: string) {
  return relayFetch<{ ok: true; config: unknown }>('/api/register', {
    method: 'POST',
    body: JSON.stringify({ workspacePath }),
  });
}

/** Generate a handshake token and trigger the agent-specific link flow. */
export function sendHandshake(workspacePath: string, agent: AgentId) {
  return relayFetch<{ ok: true; token: string; message: string }>('/api/handshake', {
    method: 'POST',
    body: JSON.stringify({ workspacePath, agent }),
  });
}

/** Discover + parse the agent transcript and start the file watcher. */
export function connectAgent(workspacePath: string, agent: AgentId) {
  return relayFetch<{ ok: true; transcriptPath: string; eventCount: number; events: RelayEvent[] }>(
    '/api/connect',
    { method: 'POST', body: JSON.stringify({ workspacePath, agent }) },
  );
}

/** Re-read every connected transcript and rebuild memory.json. */
export function syncWorkspace(workspacePath: string) {
  return relayFetch<{ ok: true; totalEvents: number; timelineCount: number; lastSync: string }>(
    '/api/sync',
    { method: 'POST', body: JSON.stringify({ workspacePath }) },
  );
}

/** Fetch the current merged memory for a workspace. */
export async function getMemory(workspacePath: string): Promise<RelayMemory> {
  const data = await relayFetch<{ ok: true; memory: RelayMemory }>(
    `/api/memory?workspacePath=${encodeURIComponent(workspacePath)}`,
  );
  return data.memory;
}

/** Lightweight reachability check used for the "Relay online" indicator. */
export async function pingRelay(): Promise<boolean> {
  try {
    await fetch(`${RELAY_URL}/api/memory?workspacePath=.`);
    return true;
  } catch {
    return false;
  }
}
