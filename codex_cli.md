# Codex CLI Transcript Extraction Analysis

Following the same systematic discovery process, I've located and extracted the conversation memory for the Codex CLI.

## 1. Storage Location
Codex CLI stores its data globally, but organizes it by a chronological folder structure rather than by workspace hash.

The base path on Windows is:
`C:\Users\[Username]\.codex\`

Conversations are stored inside the `sessions\` subdirectory, grouped hierarchically by Year -> Month -> Day:
`C:\Users\Prakrititz Borah\.codex\sessions\2026\06\14\`

## 2. File Format
Like Antigravity and Claude Code, Codex relies on the **JSON Lines (JSONL)** format. 

Files are named with a `rollout-` prefix, followed by an ISO timestamp and a session UUID:
e.g., `rollout-2026-06-14T06-05-17-019ec38d-d1ab-7c32-9e84-cd19e2387e7c.jsonl`

The structure is highly detailed and includes the full environment context and system prompts. Example:
```json
{
  "timestamp": "2026-06-14T00:35:22.612Z",
  "type": "session_meta",
  "payload": {
    "id": "019ec38d-d1ab-7c32-9e84-cd19e2387e7c",
    "cwd": "c:\\Users\\Prakrititz Borah\\Downloads\\OrbitOS",
    "model_provider": "openai",
    "base_instructions": { ... }
  }
}
```

## 3. Extraction Method
Because the `.jsonl` files are nested in a date-based directory structure, extraction requires recursively scanning the `sessions/` folder to find all logs. 

**Node.js Extraction Script:**
```javascript
const fs = require('fs');
const path = require('path');
const rootDir = 'C:/Users/Prakrititz Borah/.codex/sessions/';

function findJsonlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      findJsonlFiles(path.join(dir, file), fileList);
    } else if (file.endsWith('.jsonl')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = findJsonlFiles(rootDir);
let allLogs = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  allLogs.push(...lines.map(l => JSON.parse(l)));
}

fs.writeFileSync('example_codex.json', JSON.stringify(allLogs, null, 2));
```

## 4. Other Discoverable Artifacts
The `.codex` folder is rich with other artifacts:
- **SQLite Databases:** Files like `logs_2.sqlite`, `state_5.sqlite`, and `memories_1.sqlite` contain telemetry, internal job queues, and potentially long-term semantic memory storage, respectively.
- **Skills Directory:** Custom agent instructions and tools are stored in `~/.codex/skills/`.
- **Session Index:** `~/.codex/session_index.jsonl` acts as a quick-lookup directory for all sessions.

## Conclusion
Codex CLI also falls into the **"Very High"** ease-of-extraction category. By storing raw, unencrypted `JSONL` files chronologically, anyone can easily ingest these logs into a unified memory context database.
