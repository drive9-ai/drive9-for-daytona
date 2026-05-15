# drive9-for-daytona

> **A persistent shared workspace for Daytona sandboxes — with copy-on-write forks for isolated testing.**

This demo shows three Daytona sandboxes collaborating through a shared
**drive9** FUSE workspace. Sandbox A generates code; Sandbox B tests it
on a **forked** copy; Sandbox C continues development on the original —
all in parallel, with zero interference.

## How It Works

```text
 ┌────────────────────────────────┐
 │  Sandbox A (Daytona)           │
 │                                │
 │  1. git clone repo             │
 │  2. LLM → code-summary.md     │
 │  3. drive9 ctx fork            │
 │     → isolated test workspace  │
 │                                │
 │  /home/daytona/workspace       │
 │     ▲ drive9 FUSE mount        │
 └─────┼──────────────────────────┘
       │
       │  (Sandbox A destroyed)
       │
  ┌────┴────────────┐
  ▼                 ▼
 ┌──────────────┐  ┌──────────────┐
 │ Sandbox B    │  │ Sandbox C    │
 │ (Tester)     │  │ (Developer)  │
 │              │  │              │
 │ mount FORK   │  │ mount ORIG   │
 │ run tests    │  │ add features │
 │ write report │  │ write notes  │
 │              │  │              │
 │ Isolated!    │  │ Unblocked!   │
 └──────────────┘  └──────────────┘
       │                 │
       ▼                 ▼
  ┌──────────────────────────────┐
  │  drive9 server               │
  │  original + fork both persist│
  │                              │
  │  Fork has: test-report.md    │
  │  Original has: dev-notes.md  │
  │  Both have: code-summary.md  │
  └──────────────────────────────┘
```

## Why drive9 + Daytona

Daytona provides fast, secure sandboxes. drive9 adds a persistent,
cross-platform data layer on top:

| Capability | Daytona Volumes | drive9 |
|---|---|---|
| Persist data across sandboxes | ✅ | ✅ |
| Access from non-Daytona machines | ❌ | ✅ (any OS with CLI) |
| POSIX filesystem (git, grep, vim) | ❌ (API only) | ✅ (FUSE mount) |
| Copy-on-write data fork | ❌ | ✅ (`ctx fork`) |
| Cross-platform (macOS, Linux, CI) | ❌ | ✅ |

The key insight: Daytona Volumes are **platform-locked** storage. drive9
is a **universal filesystem** that works anywhere — Daytona sandboxes,
E2B sandboxes, local macOS, CI runners. Your data isn't trapped in one
platform.

## What happens, step by step

1. **Sandbox A** boots, installs drive9, mounts the shared workspace via FUSE.
2. `git clone` runs into the FUSE mount — the repo lands on drive9.
3. An LLM generates `code-summary.md` (or deterministic fallback).
4. `drive9 ctx fork` creates a **copy-on-write clone** of the workspace
   for isolated testing. This is instant — only metadata is copied.
5. Sandbox A writes `handoff.json` and is **destroyed**.
6. **Sandbox B** (tester) mounts the **fork** and runs tests. It can freely
   modify files without affecting the original.
7. **Sandbox C** (developer) mounts the **original** and continues
   development — unblocked by testing.
8. Both sandboxes write their results and are destroyed.
9. All artifacts persist on drive9 for inspection.

## Prerequisites

- Node.js 20+
- [Daytona API key](https://app.daytona.io)
- [drive9 API key](https://drive9.ai)
- LLM API key (optional — works without it using deterministic fallback)

## Quick start

```bash
cp .env.example .env
# Fill in DAYTONA_API_KEY, DRIVE9_API_KEY

npm install
npm run test    # smoke test: mount + read/write round-trip
npm run demo    # full 3-sandbox demo
```

## Files

| File | Purpose |
|---|---|
| `lib.ts` | Shared helpers: createSandbox, mountDrive9, run, shellQuote |
| `demo.ts` | Three-sandbox demo with fork isolation |
| `test.ts` | Mount + read/write smoke test |

## License

MIT
