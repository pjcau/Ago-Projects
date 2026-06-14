# testAgo — working rules for the agent

Apply these on EVERY task, automatically, without being reminded.

## Docker / containers — DO NOT run them
- `docker` and `docker compose` are **NOT available** in this sandbox (by
  design — the container is the security boundary). Do NOT try to run `docker`,
  `docker compose`, `docker build`, etc. — they will always fail here.
- Instead, **prepare the files** so the operator can start everything with one
  command on the host: make `docker-compose.yml` correct so a single
  `docker compose up` starts BOTH backend and frontend. Verify the compose file
  and Dockerfiles by reading them, not by running docker.
- When done, report the exact command the operator should run (e.g.
  `docker compose up --build`) in your reply — do not execute it.

## Keep the change minimal
- Touch ONLY the files strictly required by the task.
- NEVER create status / summary / evidence / verification / report / instruction
  files (e.g. `*_EVIDENCE.md`, `*_SUMMARY.md`, `CLEANUP_REPORT.md`) or helper
  scripts to "do" a task. Report what you did in your chat reply, not as files.
- Prefer editing an existing file over creating a new one. Do not restructure
  the project unless explicitly asked.

## Git
- Run real `git` commands directly (`git add`, `git commit`). Do NOT write shell
  scripts/Python wrappers to do git. If `git push` fails on auth, just report it.

## Shell
- `shell_exec` has no persistent working directory between calls. To run a
  command in a subdirectory, chain it in ONE call: `cd sub && <cmd>`.

## Before you finish
- Re-check your changes and remove anything not required by the task.
- Keep the diff as small as possible.
