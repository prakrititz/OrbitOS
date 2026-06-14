# GitHub Copilot Chat Extraction Analysis

Following the discovery framework, I investigated where GitHub Copilot (specifically the VS Code extension) stores its conversational memory. 

## 1. Storage Location
Unlike standalone CLI agents (Claude Code, Codex, Antigravity) that manage their own file-based databases, Copilot Chat is deeply integrated into VS Code's native Chat API. This means its memory is managed by the editor itself.

Data is spread across VS Code's internal storage paths:
- **Global Settings & Empty Windows:** `C:\Users\[Username]\AppData\Roaming\Code\User\globalStorage\state.vscdb`
- **Workspace-specific Chats:** `C:\Users\[Username]\AppData\Roaming\Code\User\workspaceStorage\[Hash]\state.vscdb`
- **Extension Cache (Embeddings):** `C:\Users\[Username]\AppData\Roaming\Code\User\globalStorage\github.copilot-chat\`

## 2. File Format
The transcripts are not stored as standalone text or `.jsonl` files. Instead, they are stringified JSON blobs stored as values inside VS Code's native **SQLite Databases** (`state.vscdb`).

In the SQLite `ItemTable`, VS Code uses keys like:
- `chat.ChatSessionStore.index`
- `chat.workspaceTransfer`
- `GitHub.copilot-chat`

## 3. Extraction Method
Because the data is locked inside VS Code's internal SQLite schemas, you cannot simply `cat` a file. 

To extract the memory programmatically, you must:
1. Locate the VS Code `workspaceStorage` directory.
2. Iterate through every random workspace hash folder (e.g., `129f00c0b424af65aacbf15570f3ecf2`).
3. Connect to the `state.vscdb` SQLite database in each folder.
4. Query the `ItemTable` for keys starting with `chat.`.
5. Parse the returned JSON blobs to reconstruct the conversational timeline.

*Example SQLite Query:*
```sql
SELECT value FROM ItemTable WHERE key LIKE 'chat.%';
```

## 4. Other Discoverable Artifacts
During the investigation, we also found that Copilot maintains a binary cache of embeddings and tools at:
`C:\Users\Prakrititz Borah\AppData\Roaming\Code\User\globalStorage\github.copilot-chat\toolEmbeddingsCache.bin`

## Conclusion
Evaluating Copilot against our matrix in `the_actual_plan.md`, it falls into the **"Medium"** ease-of-extraction category. While the data remains local and unencrypted, it is heavily obfuscated by VS Code's internal hashing and requires SQL queries rather than simple file reads to extract. It is much harder to build a generic extraction pipeline for this than it is for Claude Code or Antigravity.
