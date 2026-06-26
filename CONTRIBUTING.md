# Contributing to OrbitOS

Thanks for your interest in contributing to OrbitOS! This project is meant to help agents share project intelligence across Cursor, Claude, Copilot, Codex, Antigravity, and other workflows.

## How to contribute

1. Fork the repository.
2. Create a descriptive branch name, for example:
   - `fix/relay-sync-bug`
   - `feat/mcp-support`
   - `docs/add-contributing`
3. Make your changes.
4. Commit with a clear message.
5. Open a pull request against the `main` branch.

## What we review

- Bug fixes and feature improvements that align with the Relay cross-agent memory goal.
- Documentation updates for setup, usage, or contribution workflows.
- Clear commit messages and small, focused PRs.
- Consistent markdown formatting in docs.

## Testing your changes

OrbitOS is a Node.js project targeting Node 18+. Before opening a PR, please verify your work locally.

- Install dependencies if needed:
  ```bash
  npm install
  ```
- Run the project or command you changed:
  ```bash
  npm start
  ```
- For CLI behavior, you can use:
  ```bash
  npm run relay -- <command>
  ```

## Documentation updates

If your change affects installation, agent integration, or user workflows, please update `README.md`, `docs/QUICKSTART.md`, or the related documentation files.

## Style guidelines

- Keep changes focused and easy to review.
- Use clear, concise language in docs.
- Prefer existing project terminology such as “Relay”, “MCP”, and “Mission Control”.

## Reporting issues

If you find a bug or have a feature request, open an issue describing:

- What you were trying to do.
- What happened.
- What you expected to happen.
- Any relevant environment details, such as Node.js version.

## Thank you

Your contributions help make OrbitOS better for everyone. If you have any questions before submitting, feel free to open an issue first.
