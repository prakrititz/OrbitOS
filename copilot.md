# GitHub Copilot Extraction Analysis

Following the relay integration work, GitHub Copilot is now handled like the other agents by reading its local session files directly.

## 1. Storage Location

Copilot sessions can live under several local paths:

- `C:\Users\[Username]\.copilot\session-state\[sessionId]\events.jsonl`
- `C:\Users\[Username]\AppData\Roaming\Code\User\workspaceStorage\[hash]\...`
- `C:\Users\[Username]\AppData\Roaming\Code\User\globalStorage\github.copilot-chat\...`
- `C:\Users\[Username]\.config\Code\User\workspaceStorage\[hash]\...`
- `C:\Users\[Username]\.config\Code\User\globalStorage\github.copilot-chat\...`

The relay scans all supported Copilot roots and matches sessions to the current workspace using the `session.start` metadata in the first line of each JSONL file.

## 2. File Format

Each session is a JSONL stream of events. The relay currently extracts:

- `user.message`
- `assistant.message`

The parser normalizes the message content into unified relay events with `role`, `content`, `ts`, and `source`.

## 3. Extraction Method

The backend now uses a broader file-based workflow:

1. Enumerate all known Copilot roots for `**/events.jsonl`
2. Read the first line of each file
3. Match `session.start.data.context.cwd` or `workspaceFolder.folderPath` to the registered workspace
4. Parse the full JSONL file into relay memory

This stays simpler than the older VS Code database approach because the session files are still plain JSONL where available, but it is now more flexible about where they are found.

## 4. Other Discoverable Artifacts

The Copilot extension also keeps local VS Code/extension state under:

- `C:\Users\[Username]\AppData\Roaming\Code\User\globalStorage\github.copilot-chat\`

## Conclusion

Copilot now fits the same relay model as the other agents, but its discovery path is workspace-matched JSONL instead of CLI token grep or VS Code SQLite extraction.
