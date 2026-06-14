'use client';

import React from 'react';
import styles from './InfrastructureBar.module.css';

const tools = [
  { name: 'Claude Code', user: 'Pony', status: 'ok' },
  { name: 'Copilot', user: 'Unnath', status: 'ok' },
  { name: 'Codex', user: 'Arjun', status: 'ok' },
  { name: 'Cursor', user: '—', status: 'idle' },
];

export default function InfrastructureBar() {
  return (
    <div className={styles.bar}>

      <div className={styles.metrics}>
        <span className={styles.sysOk}>/.relay Node Online</span>
      </div>
    </div>
  );
}
