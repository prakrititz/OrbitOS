'use client';

import React from 'react';
import { useRelay } from '@/lib/RelayContext';
import { RelayTask } from '@/lib/relay';
import styles from './TaskQueue.module.css';

// Sample tasks shown until connected agents report real background tasks.
const SAMPLE_TASKS = [
  { id: 'task_2f9c', source: 'Claude Code', preview: 'Refactor auth middleware to use JWT refresh tokens' },
  { id: 'task_7b1a', source: 'Codex', preview: 'Generate integration tests for the /api/fs route handler' },
  { id: 'task_1d4e', source: 'Copilot', preview: 'Add optimistic UI updates to the workspace switcher' },
];

export default function TaskQueue() {
  const { memory } = useRelay();

  const tasks: RelayTask[] = Object.entries(memory?.agents || {}).flatMap(([source, a]) =>
    (a?.tasks || []).map((t) => ({ ...t, source })),
  );

  const isSample = tasks.length === 0;
  const display = isSample ? SAMPLE_TASKS : tasks;

  return (
    <div className={`glass-panel ${styles.panel}`} style={{ padding: 16 }}>
      <div className="section-title">
        AGENT TASKS <span className={styles.count}>[{display.length}]</span>
      </div>

      <div className={`${styles.queueContainer} custom-scrollbar`}>
        {display.map((t, i) => (
          <div key={`${t.id}-${i}`} className={styles.taskCard}>
            <div className={styles.taskTitle} style={{ paddingRight: 0 }}>
              {t.id}
            </div>
            <div className={styles.taskMeta}>{t.source}</div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                maxHeight: 80,
                overflow: 'hidden',
              }}
            >
              {(t.preview || '').trim()}
            </div>
          </div>
        ))}
        {isSample && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Sample tasks — connect an agent to see real background tasks.
          </div>
        )}
      </div>
    </div>
  );
}
