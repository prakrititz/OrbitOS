# Claude Code Transcript Extraction Analysis

Following the discovery framework in `the_actual_plan.md`, I monitored filesystem changes and located the exact storage mechanisms used by the Claude Code CLI. 

## 1. Storage Location
Unlike some agents that store data within the active repository (e.g., `.openhands` or `.aider`), Claude Code centralizes all its conversation memory globally in the user's home directory.

The base path on Windows is:
`C:\Users\[Username]\.claude\`

Within this folder, Claude isolates transcripts per workspace under the `projects\` directory. The folder names are derived directly from the absolute file path of the project.
For example, our OrbitOS project lives here:
`C:\Users\Prakrititz Borah\.claude\projects\c--Users-Prakrititz-Borah-Downloads-OrbitOS\`

## 2. File Format
Inside the project folder, transcripts are stored as **JSON Lines (JSONL)** files, named using UUIDs (e.g., `90fada3c-efd2-4f46-9fad-ab532ca7035f.jsonl`).

Each line is a discrete JSON event containing:
- Timestamp and session identifiers
- User inputs (prompts)
- Assistant responses and errors
- Raw context payloads, including injected tools/skills (`deep-research`, `update-config`, `verify`, etc.)

Example line:
```json
{
  "parentUuid": null,
  "type": "user",
  "message": { "role": "user", "content": [{ "type": "text", "text": "hi" }] },
  "uuid": "7a29a353-3178-4500-8b9e-108b83671ae2",
  "cwd": "c:\\Users\\Prakrititz Borah\\Downloads\\OrbitOS",
  "sessionId": "90fada3c-efd2-4f46-9fad-ab532ca7035f"
}
```

## 3. Extraction Method
Because Claude Code stores standard JSONL files, you do not need an API or cloud authentication to extract a user's local memory.

**To extract Claude Code memory programmatically (Node.js example):**
```javascript
const fs = require('fs');
const path = require('path');

// Target the specific project's hashed folder
const dir = 'C:/Users/Prakrititz Borah/.claude/projects/c--Users-Prakrititz-Borah-Downloads-OrbitOS/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'));

let allLogs = [];
for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  allLogs.push(...lines.map(l => JSON.parse(l)));
}

// Convert to a clean JSON array
fs.writeFileSync('claude_memory_dump.json', JSON.stringify(allLogs, null, 2));
```

## 4. Other Discoverable Artifacts
During reverse engineering, we also found:
- **`~/.claude/sessions/`**: Contains tiny `.json` files mapping active Process IDs (PIDs) to their current session UUIDs.
- **`~/.claude/.credentials.json`**: Stores the user's OAuth tokens.
- **`~/.claude/settings.json`**: Global user preferences and keybindings.

## Conclusion
Evaluating Claude Code using the matrix in `the_actual_plan.md`, it securely fits the **"High"** ease-of-extraction category. Although the files are slightly obfuscated by moving them out of the working repository and hashing the folder names, they remain completely unencrypted local JSONL files that can be easily parsed for a cross-agent memory system.
