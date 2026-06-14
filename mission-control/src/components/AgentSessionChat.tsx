'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRelay } from '@/lib/RelayContext';
import { AGENTS, AgentId, AgentMeta, getMissionMeta, MissionChatMessage, saveMissionMeta } from '@/lib/relay';
import styles from './AgentSessionChat.module.css';

const LAUNCH_HINTS: Record<AgentId, string> = {
  Cursor:
    'Open this folder in Cursor. In Agent chat, type `/relay context` to load handoff. Relay cannot run Cursor from the browser.',
  'Claude Code':
    'In a terminal: `cd` to your project, run `claude`, then `/relay context`. Relay does not embed Claude Code here.',
  'GitHub Copilot':
    'Open the folder in VS Code / Copilot, or run the Copilot CLI in this directory. Type `/relay context` in session.',
  Codex:
    'In a terminal: `cd` to your project, run `codex`, then `/relay context`. Relay does not embed Codex here.',
  Antigravity:
    'Open this folder in Antigravity IDE. Relay cannot run Antigravity agents from the browser.',
};

const MENTION_RE = /@([A-Za-z]*)$/;

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function extractMentions(text: string): AgentId[] {
  const found: AgentId[] = [];
  const re = /@([A-Za-z]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const agent = AGENTS.find((a) => a.label.toLowerCase() === m![1].toLowerCase());
    if (agent && !found.includes(agent.id)) found.push(agent.id);
  }
  return found;
}

function renderText(text: string) {
  return text.split(/(@[A-Za-z]+)/g).map((part, i) => {
    const m = part.match(/^@([A-Za-z]+)$/);
    const agent = m && AGENTS.find((a) => a.label.toLowerCase() === m[1].toLowerCase());
    if (agent) {
      return (
        <span key={i} className={styles.mention} style={{ color: agent.accent }}>
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function AgentSessionChat() {
  const { activeWorkspace, relayOnline, agentStates } = useRelay();
  const [messages, setMessages] = useState<MissionChatMessage[]>([]);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [author, setAuthor] = useState('You');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    if (!activeWorkspace?.localPath || !relayOnline) return;
    try {
      const { meta } = await getMissionMeta(activeWorkspace.localPath);
      setMessages(meta.chat || []);
      setCollaborators(meta.collaborators || []);
      if (meta.collaborators?.length) setAuthor(meta.collaborators[0]);
    } catch {
      /* ignore */
    }
  }, [activeWorkspace?.localPath, relayOnline]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function persistChat(next: MissionChatMessage[]) {
    if (!activeWorkspace?.localPath) return;
    setSaving(true);
    try {
      await saveMissionMeta(activeWorkspace.localPath, { chat: next });
      setMessages(next);
    } finally {
      setSaving(false);
    }
  }

  const statusFor = useCallback(
    (id: AgentId) => agentStates.find((s) => s.id === id)?.status ?? 'idle',
    [agentStates],
  );

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return AGENTS.filter((a) => a.label.toLowerCase().startsWith(q));
  }, [mentionQuery]);

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setText(value);
    const cursor = e.target.selectionStart ?? value.length;
    const m = value.slice(0, cursor).match(MENTION_RE);
    if (m) {
      setMentionQuery(m[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  }

  function selectMention(agent: AgentMeta) {
    const el = inputRef.current;
    const cursor = el?.selectionStart ?? text.length;
    const before = text.slice(0, cursor).replace(MENTION_RE, `@${agent.label} `);
    const next = before + text.slice(cursor);
    setText(next);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(before.length, before.length);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && mentionMatches.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionMatches.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + mentionMatches.length) % mentionMatches.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectMention(mentionMatches[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setMentionQuery(null);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || !activeWorkspace) return;

    const mentions = extractMentions(trimmed);

    const userMsg: MissionChatMessage = {
      id: newId(),
      author,
      mentions,
      role: 'user',
      text: trimmed,
      ts: new Date().toISOString(),
    };

    const hints: MissionChatMessage[] = mentions.map((agent) => ({
      id: newId(),
      author: 'Relay',
      agent,
      mentions: [agent],
      role: 'system',
      text: LAUNCH_HINTS[agent],
      ts: new Date().toISOString(),
    }));

    const next = [...messages, userMsg, ...hints];
    setText('');
    setMentionQuery(null);
    await persistChat(next);
  }

  const authorOptions = collaborators.length ? collaborators : ['You'];

  return (
    <div className={styles.root}>
      <div className={styles.banner}>
        <strong>Team notes + agent routing.</strong> Relay syncs memory — it does not run IDE agents in the browser.
        Type <span className="mono">@</span> to mention a connected agent and Relay will show how to open it locally.
      </div>

      <div className={styles.metaRow}>
        <label className={styles.metaLabel}>
          Posting as
          <select className={styles.select} value={author} onChange={(e) => setAuthor(e.target.value)}>
            {authorOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        {saving && <span className={styles.metaHint}>Saving…</span>}
      </div>

      <div className={`${styles.messages} custom-scrollbar`}>
        {!activeWorkspace ? (
          <div className={styles.empty}>Select a workspace to chat.</div>
        ) : messages.length === 0 ? (
          <div className={styles.empty}>
            Write a note for your team. Type <span className="mono">@</span> to mention an agent (e.g. @Claude) and
            Relay will show how to open it locally.
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`${styles.msg} ${m.role === 'system' ? styles.msgSystem : ''}`}>
              <div className={styles.msgMeta}>
                <span>{m.author}</span>
                <span className={styles.msgTime}>
                  {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={styles.msgText}>{renderText(m.text)}</div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.compose}>
        {mentionQuery !== null && mentionMatches.length > 0 && (
          <div className={styles.mentionPopup}>
            {mentionMatches.map((a, i) => {
              const status = statusFor(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  className={`${styles.mentionItem} ${i === mentionIndex ? styles.mentionItemActive : ''}`}
                  onClick={() => selectMention(a)}
                  onMouseEnter={() => setMentionIndex(i)}
                >
                  <img src={a.logo} alt="" className={styles.mentionLogo} />
                  <span className={styles.mentionLabel}>{a.label}</span>
                  <span className={`${styles.mentionStatus} ${styles[`status_${status}`]}`}>{status}</span>
                </button>
              );
            })}
          </div>
        )}
        <textarea
          ref={inputRef}
          className={styles.input}
          rows={2}
          placeholder="Message for team — type @ to mention an agent…"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={!activeWorkspace || !relayOnline}
        />
        <button type="button" className={styles.sendBtn} onClick={send} disabled={!text.trim() || !activeWorkspace}>
          Send
        </button>
      </div>
    </div>
  );
}
