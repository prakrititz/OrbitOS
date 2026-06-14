'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { getMessages, sendMessage } from '@/app/actions';
import { useRelay } from '@/lib/RelayContext';
import { AGENTS, RelayEvent } from '@/lib/relay';
import styles from './GroupChat.module.css';

const LOGO_BY_SOURCE: Record<string, string> = Object.fromEntries(
  AGENTS.map((a) => [a.id, a.logo]),
);

type ChatMessage = {
  id: string;
  sender: string;
  role: string;
  text: string;
  time: string;
};

// Accent colors so user / agent / edits are visually separable on the black UI.
const USER_COLOR = '#5c9eff';
const AGENT_COLOR = '#22d07a';
const EDIT_COLOR = '#ffb85c';

function DiffBlock({ diff }: { diff: string }) {
  return (
    <pre
      className="mono"
      style={{
        fontSize: 11,
        lineHeight: 1.5,
        background: 'var(--color-surface-1)',
        border: '1px solid var(--color-border)',
        borderRadius: 6,
        padding: 10,
        maxHeight: 360,
        overflow: 'auto',
        whiteSpace: 'pre',
        margin: '8px 0 0',
      }}
    >
      {diff.split('\n').map((line, i) => {
        const add = line.startsWith('+') && !line.startsWith('+++');
        const del = line.startsWith('-') && !line.startsWith('---');
        return (
          <div
            key={i}
            style={{ color: add ? 'var(--color-success)' : del ? '#ff9a9a' : 'var(--text-secondary)' }}
          >
            {line}
          </div>
        );
      })}
    </pre>
  );
}

function EventCard({ e }: { e: RelayEvent }) {
  const [expanded, setExpanded] = useState(true);
  const kind = e.kind || 'message';
  const isEdit = kind === 'code_edit' || kind === 'artifact';
  const isUser = kind === 'message' && e.role === 'user';
  const accent = isEdit ? EDIT_COLOR : isUser ? USER_COLOR : AGENT_COLOR;
  const logo = LOGO_BY_SOURCE[e.source || ''];
  const fallbackChar = kind === 'code_edit' ? '✎' : kind === 'artifact' ? '◆' : isUser ? 'U' : 'A';
  const label = kind === 'message' ? (isUser ? 'User' : 'Agent') : kind.replace('_', ' ');

  return (
    <div className={styles.messageWrapper} style={{ maxWidth: '100%' }}>
      <div
        className={styles.avatar}
        style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}55` }}
      >
        {logo ? (
          <img src={logo} alt={e.source} style={{ width: 22, height: 22, objectFit: 'contain' }} />
        ) : (
          fallbackChar
        )}
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          borderLeft: `2px solid ${accent}`,
          background: `${accent}0d`,
          borderRadius: '0 6px 6px 0',
          padding: '8px 12px',
        }}
      >
        <div
          onClick={() => setExpanded((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <span style={{ fontWeight: 700, color: accent, fontSize: 13 }}>{e.source || 'agent'}</span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {e.ts ? new Date(e.ts).toLocaleString() : ''}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{expanded ? '▾' : '▸'}</span>
        </div>

        {expanded && (
          <div>
            {isEdit ? (
              <>
                {(e.file || e.path) && (
                  <div className="mono" style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 8 }}>
                    {e.file || e.path}
                  </div>
                )}
                {e.summary && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{e.summary}</div>
                )}
                {e.diff ? (
                  <DiffBlock diff={e.diff} />
                ) : kind === 'artifact' && e.content ? (
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      marginTop: 8,
                    }}
                  >
                    {e.content}
                  </div>
                ) : null}
              </>
            ) : (
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  marginTop: 8,
                }}
              >
                {e.content}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GroupChat() {
  const { data: session } = useSession();
  const { activeWorkspace, memory } = useRelay();
  const [activeTab, setActiveTab] = useState<'chat' | 'activity' | 'memory'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const workspaceId = activeWorkspace?.id || 'general';
  const myName = session?.user?.name || 'You';

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    let active = true;
    const load = () => getMessages(workspaceId).then((data) => active && setMessages(data));
    load();
    const interval = setInterval(load, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [workspaceId]);

  useEffect(() => {
    if (activeTab === 'chat') scrollToBottom();
  }, [messages, activeTab]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session) return;
    const tempId = Date.now().toString();
    const optimistic: ChatMessage = {
      id: tempId,
      sender: myName,
      role: 'operator',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, optimistic]);
    const textToSend = input;
    setInput('');
    scrollToBottom();
    try {
      await sendMessage(workspaceId, textToSend);
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const timeline = useMemo(() => memory?.timeline || [], [memory]);
  const sources = useMemo(
    () => Array.from(new Set(timeline.map((e) => e.source).filter(Boolean))) as string[],
    [timeline],
  );

  const filteredTimeline = useMemo(() => {
    if (filter === 'all') return timeline;
    if (filter === 'user' || filter === 'assistant') return timeline.filter((e) => e.role === filter);
    if (filter === 'code_edit')
      return timeline.filter((e) => e.kind === 'code_edit' || e.kind === 'artifact');
    return timeline.filter((e) => e.source === filter);
  }, [timeline, filter]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return timeline.filter((e) =>
      [e.content, e.file, e.summary, e.source, e.role].some((v) => (v || '').toLowerCase().includes(q)),
    );
  }, [timeline, query]);

  const chip = (key: string, label: string) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      style={{
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        border: '1px solid var(--color-border)',
        background: filter === key ? 'rgba(255,255,255,0.08)' : 'transparent',
        color: filter === key ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className={styles.chatContainer}>
      <div className={styles.tabsHeader}>
        {(['chat', 'activity', 'memory'] as const).map((t) => (
          <div
            key={t}
            className={`${styles.tab} ${activeTab === t ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t === 'chat' ? 'Chat' : t === 'activity' ? 'Activity' : 'Memory Search'}
          </div>
        ))}
      </div>

      {activeTab === 'chat' && (
        <>
          <div className={`${styles.messagesArea} custom-scrollbar`}>
            {messages.length === 0 && (
              <div className={styles.placeholderTab}>
                {activeWorkspace
                  ? `Team chat for ${activeWorkspace.full}. Say hello.`
                  : 'Select a workspace to start the team chat.'}
              </div>
            )}
            {messages.map((msg) => {
              const own = msg.sender === myName;
              return (
                <div
                  key={msg.id}
                  className={styles.messageWrapper}
                  style={{
                    alignSelf: own ? 'flex-end' : 'flex-start',
                    flexDirection: own ? 'row-reverse' : 'row',
                  }}
                >
                  <div
                    className={styles.avatar}
                    style={{
                      background: own ? `${USER_COLOR}22` : 'var(--color-surface-3)',
                      color: own ? USER_COLOR : 'var(--text-primary)',
                      border: `1px solid ${own ? `${USER_COLOR}55` : 'var(--color-border)'}`,
                    }}
                  >
                    {msg.sender.charAt(0)}
                  </div>
                  <div className={styles.messageContent} style={{ alignItems: own ? 'flex-end' : 'flex-start' }}>
                    <div className={styles.messageHeader}>
                      <span className={styles.senderName}>{own ? 'You' : msg.sender}</span>
                      <span className={styles.timestamp}>{msg.time}</span>
                    </div>
                    {msg.text && (
                      <div
                        className={styles.messageText}
                        style={{
                          background: own ? `${USER_COLOR}18` : 'var(--color-surface-2)',
                          border: `1px solid ${own ? `${USER_COLOR}40` : 'var(--color-border)'}`,
                          padding: '8px 12px',
                          borderRadius: 8,
                        }}
                      >
                        {msg.text}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputArea}>
            <form onSubmit={handleSend} className={styles.inputForm}>
              <input
                type="text"
                className={styles.textInput}
                placeholder="Message your team…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" className={styles.sendBtn}>
                Send
              </button>
            </form>
          </div>
        </>
      )}

      {activeTab === 'activity' && (
        <>
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '12px 24px',
              borderBottom: '1px solid var(--color-border)',
              flexWrap: 'wrap',
            }}
          >
            {chip('all', 'All Events')}
            {chip('user', 'User')}
            {chip('assistant', 'Agent')}
            {chip('code_edit', 'Code Edits')}
            {sources.map((s) => chip(s, s))}
          </div>
          <div className={`${styles.messagesArea} custom-scrollbar`}>
            {filteredTimeline.length === 0 ? (
              <div className={styles.placeholderTab}>
                {activeWorkspace
                  ? 'No events yet. Connect an agent from the left to populate the timeline.'
                  : 'Select a workspace to view its agent timeline.'}
              </div>
            ) : (
              filteredTimeline
                .slice()
                .reverse()
                .map((e, i) => <EventCard key={`${e.ts}-${i}`} e={e} />)
            )}
          </div>
        </>
      )}

      {activeTab === 'memory' && (
        <>
          <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--color-border)' }}>
            <input
              type="text"
              className="mono"
              placeholder="Search the agent memory…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
          <div className={`${styles.messagesArea} custom-scrollbar`}>
            {!query.trim() ? (
              <div className={styles.placeholderTab}>Type to search across all agent events.</div>
            ) : searchResults.length === 0 ? (
              <div className={styles.placeholderTab}>No matches for “{query}”.</div>
            ) : (
              searchResults.map((e, i) => <EventCard key={`${e.ts}-${i}`} e={e} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}
