# Antigravity Transcript Extraction Analysis

Based on an exploration of the local environment following the methodologies in `the_actual_plan.md`, here are my findings on how to extract chat transcripts and memory directly from the Antigravity system.

## 1. Storage Location
Antigravity stores all conversation transcripts entirely locally on the user's filesystem. 

The path pattern is:
`[App Data Directory]\brain\[Conversation ID]\.system_generated\logs\transcript.jsonl`

For this specific environment, the exact path to our current conversation is:
`C:\Users\Prakrititz Borah\.gemini\antigravity-ide\brain\56f9135c-2f00-46c5-8899-ac16f108ac58\.system_generated\logs\transcript.jsonl`

## 2. File Format
The transcripts are stored in **JSON Lines (JSONL)** format. 
Each line is a self-contained JSON object representing a single step in the conversation. This includes user inputs, model responses, system messages, and full tool execution traces.

Example structure:
```json
{
  "step_index": 0,
  "source": "USER_EXPLICIT",
  "type": "USER_INPUT",
  "status": "DONE",
  "created_at": "2026-06-12T04:13:41Z",
  "content": "<USER_REQUEST>...</USER_REQUEST>"
}
```

## 3. Extraction Method
Because this is a standard JSONL file stored locally, extraction is trivial. Unlike browser-based agents where you must intercept WebSockets or dig through `indexedDB` (as Step 7 in the plan outlines), Antigravity makes its state highly accessible.

**To extract a specific conversation in PowerShell:**
```powershell
Get-Content "C:\Users\Prakrititz Borah\.gemini\antigravity-ide\brain\56f9135c-2f00-46c5-8899-ac16f108ac58\.system_generated\logs\transcript.jsonl"
```

**To search all past conversations for a keyword (Step 4 from the plan):**
```powershell
Select-String -Path "C:\Users\Prakrititz Borah\.gemini\antigravity-ide\brain\*\.system_generated\logs\transcript.jsonl" -Pattern "BananaPurpleDragon2026"
```

## 4. Other Discoverable Artifacts
In addition to the raw transcript, monitoring the filesystem during execution reveals other rich data sources:
- **Background Task Logs:** Terminal commands sent to the background are logged sequentially in `.system_generated\tasks\`
- **Knowledge Items (KIs):** Curated summaries of past work and code patterns are stored globally in `C:\Users\Prakrititz Borah\.gemini\antigravity-ide\knowledge\`
- **Persistent Artifacts:** Generated plans, code, or markdown documents are saved locally in the `artifacts\` folder of the current brain.

## Conclusion
Evaluating Antigravity using the matrix in `the_actual_plan.md` (Step 1: Classify Targets), this system falls into the **"Very High"** ease-of-extraction category. It operates entirely locally and writes unencrypted, standard JSON objects directly to the filesystem in real-time, making it an ideal candidate for building a cross-agent memory foundation.
