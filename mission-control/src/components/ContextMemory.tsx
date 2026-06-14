'use client';

import React, { useState } from 'react';
import { useRelay } from '@/lib/RelayContext';
import { RelayArtifact } from '@/lib/relay';
import styles from './ContextMemory.module.css';

function artifactSummary(a: RelayArtifact): string {
  if (a.metadata) {
    try {
      const m = JSON.parse(a.metadata);
      if (m.Summary || m.ArtifactType) return m.Summary || m.ArtifactType;
    } catch {
      /* not JSON */
    }
  }
  return (a.content || '').slice(0, 120);
}

// Sample content shown until connected agents emit real artifacts/memory.
const SAMPLE_TREE = [
  {
    name: 'project',
    children: [
      { key: 'preferred_stack', value: 'Next.js + MongoDB' },
      { key: 'environment', value: 'production' },
      { key: 'deploy_strategy', value: 'blue-green' },
    ],
  },
  {
    name: 'constraints',
    children: [
      { key: 'no_vendor_lock_in', value: 'true' },
      { key: 'max_latency_p99', value: '200ms' },
    ],
  },
  {
    name: 'user_prefs',
    children: [
      { key: 'code_style', value: 'functional' },
      { key: 'test_coverage', value: '80%' },
    ],
  },
];

function PlaceholderTree() {
  const [open, setOpen] = useState<Record<string, boolean>>({ project: true, constraints: true });
  return (
    <>
      <div className={styles.treeRoot}>/</div>
      {SAMPLE_TREE.map((node) => {
        const isOpen = open[node.name] ?? false;
        return (
          <div key={node.name} className={styles.treeNode}>
            <div
              className={styles.nodeHeader}
              onClick={() => setOpen((o) => ({ ...o, [node.name]: !isOpen }))}
            >
              <span className={styles.icon}>{isOpen ? '-' : '+'}</span>
              <span className={styles.nodeName}>{node.name}</span>
            </div>
            {isOpen && (
              <div className={styles.nodeChildren}>
                {node.children.map((c) => (
                  <div key={c.key} className={styles.childNode}>
                    <span className={styles.childKey}>{c.key}:</span>
                    <span className={styles.childValue}>{c.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div style={{ marginTop: 12, fontSize: 10, color: 'var(--text-muted)' }}>
        Sample memory — connect an agent to populate this with real artifacts.
      </div>
    </>
  );
}

export default function ContextMemory() {
  const { memory } = useRelay();

  const artifacts: RelayArtifact[] = Object.entries(memory?.agents || {}).flatMap(([source, a]) =>
    (a?.artifacts || []).map((art) => ({ ...art, source })),
  );

  return (
    <div className={`glass-panel ${styles.panel}`} style={{ padding: 16 }}>
      <div className="section-title">
        SHARED MEMORY BANK <span className={styles.count}>[{artifacts.length} artifacts]</span>
      </div>

      <div className={`${styles.treeContainer} custom-scrollbar`}>
        {artifacts.length === 0 ? (
          <PlaceholderTree />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {artifacts.map((a, i) => (
              <div
                key={`${a.name}-${i}`}
                style={{
                  background: 'var(--color-surface-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 4,
                  padding: 10,
                }}
              >
                <div className="mono" style={{ fontSize: 12, color: 'var(--color-active)', fontWeight: 600 }}>
                  {a.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '2px 0 6px' }}>
                  {a.source}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {artifactSummary(a)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
