# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/) and the project adheres to Semantic Versioning.

## [0.1.0] - 2026-07-06

### Added

- Initial task management CLI (`task`) with commands:
  - `add <title> [--priority] [--tag ...]` — create a pending task
  - `list [--state | --all] [--priority] [--tag ...]` — list tasks (pending only by default)
  - `complete <id>` / `reopen <id>` — toggle completion state
  - `edit <id> [--title] [--priority | --clear-priority] [--tag ... | --clear-tags]`
  - `remove <id>` — delete a task
  - `help` — usage
- `--json` machine-readable output on every command.
- Sequential, non-reusing task identifiers.
- Persistent per-user JSON store (on-disk schema `version: 1`) with atomic writes and an exclusive
  lock for safe concurrent invocations; overridable via `MY_TASK_CLI_STORE`.
