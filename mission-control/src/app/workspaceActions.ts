'use server';

// Server actions for the "Add Workspace" flow that need Node APIs.
// Runs on the machine hosting mission-control (same machine as the relay
// companion in local/desktop use).

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

function clonesRoot(): string {
  const configured = process.env.RELAY_CLONES_DIR?.trim();
  return configured || path.join(os.homedir(), 'relay-workspaces');
}

/**
 * Clone a GitHub repo locally and return the absolute path so the caller can
 * register it on relay. Idempotent: if already cloned, returns the existing path.
 */
export async function cloneRepo(
  repoFullName: string,
): Promise<{ path: string; cloned: boolean }> {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Not authenticated');
  const token = (session as { accessToken?: string }).accessToken;

  const leaf = repoFullName.split('/').pop() || repoFullName.replace(/[^a-zA-Z0-9-_]/g, '-');
  const root = clonesRoot();
  fs.mkdirSync(root, { recursive: true });
  const target = path.join(root, leaf);

  if (fs.existsSync(path.join(target, '.git'))) {
    return { path: target, cloned: false };
  }
  if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
    throw new Error(`Destination already exists and is not a git repo: ${target}`);
  }

  const auth = token ? `x-access-token:${token}@` : '';
  const url = `https://${auth}github.com/${repoFullName}.git`;
  const res = spawnSync('git', ['clone', '--depth', '1', url, target], {
    encoding: 'utf-8',
    timeout: 180000,
  });

  if (res.status !== 0) {
    const raw = res.stderr || res.error?.message || 'git clone failed';
    throw new Error(token ? raw.split(token).join('***') : raw);
  }
  return { path: target, cloned: true };
}
