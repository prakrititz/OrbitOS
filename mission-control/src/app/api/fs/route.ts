// Server-side local directory browser for the "Upload Project Directory" flow.
//
// Browsers cannot read a folder's absolute path (security), so the picker asks
// the Next server — which runs on the same machine as the relay companion in
// local/desktop use — to enumerate the real filesystem and hand back absolute
// paths. NOTE: in a pure-cloud deployment this would browse the SERVER's disk;
// that responsibility moves into the local companion later (see plan Stage 2).

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

interface Entry {
  name: string;
  path: string;
  isDir: boolean;
}

function listDrives(): Entry[] {
  const drives: Entry[] = [];
  for (let c = 65; c <= 90; c++) {
    const root = `${String.fromCharCode(c)}:\\`;
    try {
      if (fs.existsSync(root)) drives.push({ name: root, path: root, isDir: true });
    } catch {
      /* drive not ready */
    }
  }
  return drives;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dir = new URL(request.url).searchParams.get('path');

  // Top level: Windows drive letters, or the root on POSIX.
  if (!dir) {
    const entries = process.platform === 'win32' ? listDrives() : [{ name: '/', path: '/', isDir: true }];
    return NextResponse.json({ path: null, parent: null, entries });
  }

  const resolved = path.resolve(dir);
  try {
    const dirents = await fs.promises.readdir(resolved, { withFileTypes: true });
    const entries: Entry[] = dirents
      .map((d) => ({ name: d.name, path: path.join(resolved, d.name), isDir: d.isDirectory() }))
      .sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));
    const parent = path.dirname(resolved);
    return NextResponse.json({
      path: resolved,
      parent: parent === resolved ? null : parent,
      entries,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
