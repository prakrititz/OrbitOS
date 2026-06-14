'use client';

import React, { useState } from 'react';
import { useRelay } from '@/lib/RelayContext';
import { RelayDashboard } from '@/lib/relay';
import styles from './RelayBrainPanel.module.css';

const SECTIONS = [
  { key: 'handoff', label: 'Handoff', pick: (d: RelayDashboard | null) => d?.handoff?.markdown || '' },
  { key: 'currentTask', label: 'Current task', pick: (d: RelayDashboard | null) => d?.ir?.currentTask || '' },
  { key: 'decisions', label: 'Decisions', pick: (d: RelayDashboard | null) => d?.ir?.decisions || '' },
  { key: 'failures', label: 'Failures', pick: (d: RelayDashboard | null) => d?.ir?.failures || '' },
  { key: 'project', label: 'Project', pick: (d: RelayDashboard | null) => d?.ir?.project || '' },
] as const;

export default function RelayBrainPanel() {
  const { activeWorkspace, dashboard, relayOnline, syncing, refresh } = useRelay();
  const [active, setActive] = useState<string>('handoff');

  if (!activeWorkspace) {
    return (
      <div className={`glass-panel ${styles.panel}`}>
        <div className="section-title">RELAY BRAIN</div>
        <p className={styles.hint}>Add a workspace to view handoff, tasks, and decisions.</p>
      </div>
    );
  }

  if (!relayOnline) {
    return (
      <div className={`glass-panel ${styles.panel}`}>
        <div className="section-title">RELAY BRAIN</div>
        <p className={styles.hint}>
          Relay API offline. Run <span className="mono">relay serve</span> or re-run{' '}
          <span className="mono">relay init</span> (starts UI in background).
        </p>
      </div>
    );
  }

  return (
    <div className={`glass-panel ${styles.panel}`}>
      <div className={styles.header}>
        <div className="section-title">RELAY BRAIN</div>
        <button type="button" className={styles.refreshBtn} disabled={syncing} onClick={() => refresh({ full: true })}>
          {syncing ? '…' : '↻'}
        </button>
      </div>

      <div className={`${styles.tabs} custom-scrollbar`}>
        {SECTIONS.map((section) => (
          <button
            key={section.key}
            type="button"
            className={`${styles.tab} ${active === section.key ? styles.tabActive : ''}`}
            onClick={() => setActive(section.key)}
          >
            {section.label}
          </button>
        ))}
      </div>

      {(() => {
        const section = SECTIONS.find((s) => s.key === active) ?? SECTIONS[0];
        const content = section.pick(dashboard);
        return (
          <pre className={`${styles.body} mono custom-scrollbar`}>
            {content.trim() || `No ${section.label.toLowerCase()} yet — run /relay update in an agent.`}
          </pre>
        );
      })()}
    </div>
  );
}
