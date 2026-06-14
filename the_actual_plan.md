If you want to explore the **"extract existing stuff"** route first, I'd treat it as a digital forensics problem.

The question isn't:

> "Where does Cursor store chats?"

The question is:

> "What artifacts are created when an agent operates?"

---

# Step 1: Classify Targets

Create a matrix:

| Platform    | Local Files | Local DB | API | MCP     | Cloud Sync | Easy?     |
| ----------- | ----------- | -------- | --- | ------- | ---------- | --------- |
| Claude Code | ?           | ?        | No  | Yes     | Partial    | High      |
| Cursor      | ?           | ?        | No  | Partial | Yes        | Medium    |
| Codex CLI   | ?           | ?        | No  | Yes     | Low        | High      |
| OpenHands   | Yes         | Yes      | Yes | Yes     | Optional   | Very High |
| Aider       | Yes         | Yes      | No  | No      | No         | Very High |

Start with open-source/local tools first.

---

# Step 2: Observe Filesystem Changes

This is how reverse engineers do it.

Before opening Claude/Cursor:

```bash
find ~ > before.txt
```

Open a conversation.

Send:

```text
Hello World
```

Then:

```bash
find ~ > after.txt
diff before.txt after.txt
```

Look for:

```text
.claude
.cursor
.cache
.config
.local/share
```

---

# Step 3: Monitor Real-Time Writes

Linux:

```bash
inotifywait -m ~
```

Mac:

```bash
fs_usage
```

Windows:

```text
Process Monitor (ProcMon)
```

Then:

1. Start monitoring.
2. Send a message.
3. Watch what files get touched.

You'll often discover:

```text
conversation.json
history.db
sqlite.db
session.jsonl
```

---

# Step 4: Search for Chat Content

Send a unique phrase:

```text
BananaPurpleDragon2026
```

Then search:

```bash
grep -r "BananaPurpleDragon2026" ~
```

If it exists locally you'll find the file immediately.

This is one of the fastest techniques.

---

# Step 5: Check Databases

Many apps use SQLite.

Search:

```bash
find ~ -name "*.db"
find ~ -name "*.sqlite"
```

Then:

```bash
sqlite3 database.db
.tables
```

Look for:

```text
messages
sessions
conversations
events
artifacts
```

---

# Step 6: Monitor Network Traffic

If nothing is local:

Use:

```text
mitmproxy
```

or

```text
Wireshark
```

Observe:

```text
Send Message
↓
WebSocket
↓
HTTPS Request
```

Sometimes transcripts are synced to cloud APIs.

---

# Step 7: Browser-Based Agents

For ChatGPT, Claude Web, Gemini:

Inspect:

```javascript
localStorage
sessionStorage
indexedDB
```

Open DevTools:

```javascript
indexedDB.databases()
```

Many web apps cache conversation metadata locally.

---

# Step 8: Create a Discovery Agent

This is where AI becomes useful.

Feed it:

```text
Platform Name
Operating System
Installation Path
```

And instruct:

```text
Find all possible transcript locations.

Check:
- hidden folders
- sqlite databases
- json files
- cache folders
- websocket traffic
- indexeddb
- localstorage

Return:
1. Storage path
2. Format
3. Confidence
4. Extraction method
```

---

# What I would investigate first

If your end goal is cross-agent memory, prioritize platforms that are easiest to extract:

1. Aider
2. OpenHands
3. Claude Code
4. Codex CLI
5. Cursor

The first four are much more likely to expose local artifacts.

---

### A practical experiment

Don't start by reverse-engineering five platforms.

Take **Claude Code** and perform:

```text
1. Send unique string:
   "MEMORY_TEST_847362"

2. Search filesystem:
   grep -R "MEMORY_TEST_847362" ~

3. Monitor file writes

4. Inspect sqlite databases

5. Inspect config directories

6. Document findings
```

Once you can reliably extract one platform's transcript, build a generic:

```text
Extractor Interface

extract()
discover()
watch()
parse()
```

Then write adapters:

```text
ClaudeExtractor
CursorExtractor
CodexExtractor
```

That becomes the foundation of your memory system. The key is to discover **where the transcript physically lives** before worrying about summaries, embeddings, or retrieval. Once you can reliably obtain raw conversation events, everything else is downstream processing.