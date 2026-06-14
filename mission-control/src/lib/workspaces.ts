// Workspace registry. Stage 1 keeps this in localStorage (single-user, single
// machine). Stage 2 will mirror it into MongoDB as cloud "Projects" with
// membership — the shape here is intentionally forward-compatible.

export interface Workspace {
  id: string;
  name: string; // 2-char badge shown in the rail
  full: string; // display name
  source: 'github' | 'local';
  localPath: string; // absolute path the relay backend registered
  githubRepo?: string; // owner/name when source === 'github'
  active: boolean;
}

const STORAGE_KEY = 'relay_workspaces';
export const WORKSPACES_CHANGED_EVENT = 'relay:workspaces-changed';

/** A workspace is "real" only once it has been registered on relay with a local
 *  path. This filters out legacy/placeholder entries from earlier builds. */
function isRealWorkspace(w: unknown): w is Workspace {
  return (
    !!w &&
    typeof w === 'object' &&
    typeof (w as Workspace).localPath === 'string' &&
    (w as Workspace).localPath.length > 0 &&
    ((w as Workspace).source === 'github' || (w as Workspace).source === 'local')
  );
}

export function loadWorkspaces(): Workspace[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const real = parsed.filter(isRealWorkspace);
    // Ensure exactly-or-at-most one active workspace survives the filter.
    if (real.length && !real.some((w) => w.active)) real[0].active = true;
    return real;
  } catch {
    return [];
  }
}

export function saveWorkspaces(workspaces: Workspace[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
  window.dispatchEvent(new CustomEvent(WORKSPACES_CHANGED_EVENT));
}

/** Build a 2-char badge from a display name ("prakrititz/OrbitOS" -> "OR"). */
export function badgeFromName(full: string): string {
  const leaf = full.split(/[/\\]/).filter(Boolean).pop() || full;
  return leaf.slice(0, 2).toUpperCase();
}

export function getActiveWorkspace(workspaces: Workspace[]): Workspace | null {
  return workspaces.find((w) => w.active) || null;
}
