'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useRelay } from '@/lib/RelayContext';
import { badgeFromName } from '@/lib/workspaces';
import { cloneRepo } from '@/app/workspaceActions';
import DirectoryPicker from '@/components/DirectoryPicker';
import styles from './page.module.css';

interface Repo {
  id: number;
  full_name: string;
  description: string;
}

type Method = 'github' | 'local';

export default function Onboarding() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { registerAndAdd, relayOnline } = useRelay();

  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [method, setMethod] = useState<Method>('github');
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [showPicker, setShowPicker] = useState(false); // GitHub "I have it locally"
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session) {
      const token = (session as { accessToken?: string }).accessToken;
      if (token) {
        fetch('https://api.github.com/user/repos?sort=updated&per_page=30', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setRepos(data);
            setLoadingRepos(false);
          })
          .catch(() => setLoadingRepos(false));
      } else {
        setLoadingRepos(false);
      }
    }
  }, [status, session, router]);

  async function register(localPath: string, source: Method, full: string, githubRepo?: string) {
    setBusy(true);
    setError(null);
    setStatusText('Registering workspace on relay…');
    try {
      const id = source === 'github' && selectedRepo ? String(selectedRepo.id) : `local-${Date.now()}`;
      await registerAndAdd({ id, name: badgeFromName(full), full, source, localPath, githubRepo });
      router.push('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to register workspace');
      setBusy(false);
      setStatusText(null);
    }
  }

  async function handleClone(repo: Repo) {
    setBusy(true);
    setError(null);
    setStatusText(`Cloning ${repo.full_name}…`);
    try {
      const { path } = await cloneRepo(repo.full_name);
      await register(path, 'github', repo.full_name, repo.full_name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Clone failed');
      setBusy(false);
      setStatusText(null);
    }
  }

  function handleLocalPick(absPath: string) {
    const leaf = absPath.split(/[/\\]/).filter(Boolean).pop() || absPath;
    register(absPath, 'local', leaf);
  }

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.loadingText}>Loading…</div>
      </div>
    );
  }

  const tab = (m: Method, label: string) => (
    <button
      type="button"
      onClick={() => {
        setMethod(m);
        setSelectedRepo(null);
        setShowPicker(false);
        setError(null);
      }}
      style={{
        flex: 1,
        padding: '10px 12px',
        background: method === m ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: '1px solid var(--color-border)',
        borderColor: method === m ? 'var(--color-active)' : 'var(--color-border)',
        borderRadius: 6,
        color: method === m ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.card}`}>
        <div>
          <h1 className={styles.title}>Add Workspace</h1>
          <p className={styles.subtitle}>
            Connect a project so relay can track your coding agents&apos; shared memory. Both
            methods register a local folder where your agents run.
          </p>
        </div>

        {!relayOnline && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-secondary)',
              fontSize: 12,
            }}
          >
            Relay backend is offline. Start it with <span className="mono">node backend/server.js</span>{' '}
            — registration needs it running.
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 6,
              border: '1px solid rgba(255,120,120,0.5)',
              color: '#ff9a9a',
              fontSize: 12,
              wordBreak: 'break-word',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          {tab('github', 'Connect from GitHub')}
          {tab('local', 'Upload Local Directory')}
        </div>

        {busy && statusText && (
          <div className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {statusText}
          </div>
        )}

        {/* ── GitHub ── */}
        {method === 'github' && !selectedRepo && (
          <div className={`${styles.repoList} custom-scrollbar`}>
            {loadingRepos ? (
              <div className={styles.empty}>Loading repositories…</div>
            ) : repos.length === 0 ? (
              <div className={styles.empty}>No repositories found or missing permissions.</div>
            ) : (
              repos.map((repo) => (
                <div key={repo.id} className={styles.repoItem}>
                  <div className={styles.repoInfo}>
                    <div className={styles.repoName}>{repo.full_name}</div>
                    <div className={styles.repoDesc}>{repo.description || 'No description provided.'}</div>
                  </div>
                  <button
                    className={styles.addBtn}
                    onClick={() => {
                      setSelectedRepo(repo);
                      setShowPicker(false);
                      setError(null);
                    }}
                  >
                    Select
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {method === 'github' && selectedRepo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button className={styles.skipBtn} style={{ alignSelf: 'flex-start' }} onClick={() => setSelectedRepo(null)}>
              ← Back to repositories
            </button>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
              Add <strong>{selectedRepo.full_name}</strong>
            </div>

            {!showPicker ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className={styles.addBtn} disabled={busy} onClick={() => setShowPicker(true)}>
                  I have it locally — pick the folder
                </button>
                <button className={styles.addBtn} disabled={busy} onClick={() => handleClone(selectedRepo)}>
                  Clone it for me
                </button>
              </div>
            ) : (
              <DirectoryPicker
                onPick={(p) => register(p, 'github', selectedRepo.full_name, selectedRepo.full_name)}
                busy={busy}
                pickLabel="Register this folder"
              />
            )}
          </div>
        )}

        {/* ── Local directory ── */}
        {method === 'local' && <DirectoryPicker onPick={handleLocalPick} busy={busy} />}

        <button className={styles.skipBtn} onClick={() => router.push('/')}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
