'use client';

// Single source of truth for the live relay state, shared by every panel.
// Holds the workspace list, the active workspace, the polled relay memory, and
// per-agent connection state, plus the connect/sync actions. Mounted once in the
// root layout so state survives client-side navigation (e.g. onboarding -> home).

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AGENTS,
  AgentId,
  RelayMemory,
  connectAgent as apiConnect,
  getMemory,
  pingRelay,
  registerWorkspace,
  sendHandshake,
  syncWorkspace,
} from './relay';
import {
  Workspace,
  WORKSPACES_CHANGED_EVENT,
  getActiveWorkspace,
  loadWorkspaces,
  saveWorkspaces,
} from './workspaces';

export type AgentStatus = 'idle' | 'handshaking' | 'connected' | 'error';

export interface AgentState {
  id: AgentId;
  status: AgentStatus;
  eventCount: number;
  error?: string;
}

interface RelayContextValue {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  relayOnline: boolean;
  memory: RelayMemory | null;
  agentStates: AgentState[];
  addWorkspace: (ws: Omit<Workspace, 'active'>) => void;
  selectWorkspace: (id: string) => void;
  removeWorkspace: (id: string) => void;
  /** Register a local path on relay, then add it as the active workspace. */
  registerAndAdd: (ws: Omit<Workspace, 'active'>) => Promise<void>;
  connect: (agent: AgentId) => Promise<void>;
  refresh: () => Promise<void>;
}

const RelayContext = createContext<RelayContextValue | null>(null);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function RelayProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [relayOnline, setRelayOnline] = useState(false);
  const [memory, setMemory] = useState<RelayMemory | null>(null);
  const [pending, setPending] = useState<
    Partial<Record<AgentId, { status: 'handshaking' | 'error'; error?: string }>>
  >({});

  const activeWorkspace = useMemo(() => getActiveWorkspace(workspaces), [workspaces]);
  const activePath = activeWorkspace?.localPath || null;

  // ── Load persisted workspaces + keep in sync across tabs ──
  useEffect(() => {
    const loaded = loadWorkspaces();
    setWorkspaces(loaded);
    saveWorkspaces(loaded); // rewrite storage to drop any legacy/placeholder entries
    const reload = () => setWorkspaces(loadWorkspaces());
    window.addEventListener('storage', reload);
    window.addEventListener(WORKSPACES_CHANGED_EVENT, reload);
    return () => {
      window.removeEventListener('storage', reload);
      window.removeEventListener(WORKSPACES_CHANGED_EVENT, reload);
    };
  }, []);

  // ── Relay reachability indicator ──
  useEffect(() => {
    let alive = true;
    const check = async () => {
      const ok = await pingRelay();
      if (alive) setRelayOnline(ok);
    };
    check();
    const t = setInterval(check, 10000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!activePath) return;
    try {
      await syncWorkspace(activePath);
      const mem = await getMemory(activePath);
      setMemory(mem);
    } catch {
      // Relay offline or workspace not registered yet — leave last memory as-is.
    }
  }, [activePath]);

  // ── Poll the active workspace's memory (~5s), like basic_frontend ──
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useEffect(() => {
    setMemory(null);
    setPending({});
    if (!activePath) return;
    refreshRef.current();
    const t = setInterval(() => refreshRef.current(), 5000);
    return () => clearInterval(t);
  }, [activePath]);

  const persist = useCallback((next: Workspace[]) => {
    setWorkspaces(next);
    saveWorkspaces(next);
  }, []);

  const addWorkspace = useCallback(
    (ws: Omit<Workspace, 'active'>) => {
      setWorkspaces((prev) => {
        const others = prev.filter((w) => w.id !== ws.id).map((w) => ({ ...w, active: false }));
        const next = [...others, { ...ws, active: true }];
        saveWorkspaces(next);
        return next;
      });
    },
    [],
  );

  const registerAndAdd = useCallback(
    async (ws: Omit<Workspace, 'active'>) => {
      await registerWorkspace(ws.localPath); // throws if relay is offline
      addWorkspace(ws);
    },
    [addWorkspace],
  );

  const selectWorkspace = useCallback(
    (id: string) => {
      setWorkspaces((prev) => {
        const next = prev.map((w) => ({ ...w, active: w.id === id }));
        saveWorkspaces(next);
        return next;
      });
    },
    [],
  );

  const removeWorkspace = useCallback(
    (id: string) => {
      setWorkspaces((prev) => {
        const remaining = prev.filter((w) => w.id !== id);
        if (remaining.length && !remaining.some((w) => w.active)) remaining[0].active = true;
        saveWorkspaces(remaining);
        return remaining;
      });
    },
    [],
  );

  const connect = useCallback(
    async (agent: AgentId) => {
      if (!activePath) throw new Error('Select a workspace first.');
      setPending((p) => ({ ...p, [agent]: { status: 'handshaking' } }));
      try {
        await sendHandshake(activePath, agent);
        await sleep(2000); // let the agent session appear
        await apiConnect(activePath, agent);
        setPending((p) => {
          const next = { ...p };
          delete next[agent];
          return next;
        });
        await refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Connection failed';
        setPending((p) => ({ ...p, [agent]: { status: 'error', error: message } }));
        throw err;
      }
    },
    [activePath, refresh],
  );

  // ── Effective per-agent state: in-flight overrides, else memory-derived ──
  const agentStates = useMemo<AgentState[]>(() => {
    return AGENTS.map(({ id }) => {
      const p = pending[id];
      const mem = memory?.agents?.[id];
      const eventCount = mem?.eventCount ?? 0;
      if (p) return { id, status: p.status, eventCount, error: p.error };
      if (mem?.status === 'connected') return { id, status: 'connected', eventCount };
      return { id, status: 'idle', eventCount: 0 };
    });
  }, [pending, memory]);

  const value: RelayContextValue = {
    workspaces,
    activeWorkspace,
    relayOnline,
    memory,
    agentStates,
    addWorkspace,
    selectWorkspace,
    removeWorkspace,
    registerAndAdd,
    connect,
    refresh,
  };

  return <RelayContext.Provider value={value}>{children}</RelayContext.Provider>;
}

export function useRelay(): RelayContextValue {
  const ctx = useContext(RelayContext);
  if (!ctx) throw new Error('useRelay must be used within <RelayProvider>');
  return ctx;
}
