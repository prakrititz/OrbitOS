# Cross-Agent Memory System — Implementation Plan

## Stage 1 — Transcript discovery

Pick one agent (Claude Code or Aider). Send a unique string. grep the filesystem. Confirm raw storage path + format (JSONL, SQLite, flat JSON).

**Claude Code path:** `~/.claude/projects/<project-hash>/<session-id>.jsonl`

```bash
grep -r "MEMORY_TEST_847362" ~/.claude/
```

**Recommended order:** Aider → OpenHands → Claude Code → Codex CLI → Cursor
Open-source first — local artifacts are easiest to verify.

---

## Stage 2 — Extractor interface

Build a generic interface once the storage path is confirmed. Write the first adapter for the agent confirmed in Stage 1.

**Interface:**
```python
class Extractor:
    def discover(self) -> list[Path]: ...   # find all transcript files
    def extract(self, path: Path) -> list[Event]: ...  # parse into events
    def watch(self, callback) -> None: ...  # real-time file watcher
    def parse(self, raw: str) -> Event: ... # parse a single raw line
```

**Adapters:** `ClaudeExtractor` · `AiderExtractor` · `CursorExtractor` · `CodexExtractor`

---

## Stage 3 — Normalize + store

Parse raw events into a unified schema. Persist to a local SQLite store. Index by agent, session, and time.

**Unified event schema:**
```python
{
  "timestamp": "ISO8601",
  "agent": "claude_code | aider | cursor | ...",
  "session_id": "str",
  "role": "user | assistant | tool",
  "content": "str"
}
```

**Store:** SQLite with indexes on `(agent, session_id)` and `timestamp`.

---

## Stage 4 — Summarize + embed

Chunk sessions. Run LLM summarization per session or per day. Embed summaries and store vectors.

**Pipeline:**
1. Chunk by session boundary (one file = one session for Claude Code)
2. Summarize each chunk with an LLM call
3. Embed the summary text
4. Store vectors in sqlite-vec or Chroma

---

## Stage 5 — Retrieval + injection

Query by semantic similarity or recency. Return top-k summaries. Inject as context into the next agent session via MCP or system prompt.

**Retrieval:**
```python
def recall(query: str, k: int = 5) -> list[Summary]:
    # semantic search over embeddings
    # optionally filter by recency or agent
    ...
```

**Injection options:**
- Claude Code: MCP server that exposes `recall()` as a tool
- Others: prepend summaries to system prompt at session start