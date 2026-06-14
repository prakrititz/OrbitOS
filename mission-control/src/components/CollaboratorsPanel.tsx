'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRelay } from '@/lib/RelayContext';
import { getMissionMeta, saveMissionMeta } from '@/lib/relay';
import styles from './CollaboratorsPanel.module.css';

const SEED_COLLABORATORS = ['Unnath', 'Prakrititz', 'Krishna', 'Gathik', 'Hemanth'];

const ACCENTS = ['#7dd3fc', '#a78bfa', '#5eead4', '#f0abfc', '#fca5a5', '#fcd34d', '#86efac'];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function CollaboratorsPanel() {
  const { activeWorkspace, relayOnline } = useRelay();
  const [names, setNames] = useState<string[]>(SEED_COLLABORATORS);
  const [draft, setDraft] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!activeWorkspace?.localPath || !relayOnline) return;
    try {
      const { meta } = await getMissionMeta(activeWorkspace.localPath);
      if (meta.collaborators?.length) setNames(meta.collaborators);
    } catch {
      /* keep seed list */
    }
  }, [activeWorkspace?.localPath, relayOnline]);

  useEffect(() => {
    load();
  }, [load]);

  async function persist(next: string[]) {
    setNames(next);
    if (!activeWorkspace?.localPath) return;
    setSaving(true);
    try {
      await saveMissionMeta(activeWorkspace.localPath, { collaborators: next });
    } finally {
      setSaving(false);
    }
  }

  function addName() {
    const name = draft.trim();
    if (!name || names.includes(name)) return;
    setDraft('');
    setShowAdd(false);
    persist([...names, name]);
  }

  function removeName(name: string) {
    persist(names.filter((n) => n !== name));
  }

  return (
    <div className={`glass-panel ${styles.panel}`}>
      <div className="section-title">
        COLLABORATORS {saving && <span className={styles.muted}>saving…</span>}
      </div>

      <div className={styles.avatarRow}>
        {names.map((name) => (
          <div key={name} className={styles.avatarChip} title={name}>
            <span className={styles.avatar} style={{ background: colorFor(name) }}>
              {initials(name)}
            </span>
            <span className={styles.avatarName}>{name}</span>
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => removeName(name)}
              aria-label={`Remove ${name}`}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className={styles.addChip}
          onClick={() => setShowAdd((s) => !s)}
          aria-label="Add collaborator"
          title="Add collaborator"
        >
          +
        </button>
      </div>

      {showAdd && (
        <div className={styles.addRow}>
          <input
            className={styles.input}
            placeholder="Name"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addName()}
          />
          <button type="button" className={styles.addBtn} onClick={addName} disabled={!draft.trim()}>
            Add
          </button>
        </div>
      )}
    </div>
  );
}
