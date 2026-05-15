# drive9 + Daytona

> **Sandboxes are temporary. Your code is not.**

Three [Daytona](https://daytona.io) sandboxes are created and destroyed, one after another. The code, git history, and project survive every destruction — because they live on [drive9](https://drive9.ai), a persistent filesystem designed for AI agent workflows.

```
  Sandbox A                Sandbox B                Sandbox C
  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
  │ git init     │         │ git log      │         │ git log      │
  │ write code   │         │  → A's commit│         │  → A+B commits│
  │ commit       │         │ add features │         │ fork         │
  │ node run → 3 │         │ commit       │         │ break fork   │
  └──────┬───────┘         │ node run → 12│         │ original OK  │
         │ destroyed       └──────┬───────┘         └──────┬───────┘
         ▼                        │ destroyed               │ destroyed
                                  ▼                         ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │                          drive9                                 │
  │                code + git history + forks                       │
  │                      persist here                               │
  └─────────────────────────────────────────────────────────────────┘
```

## What makes this different

Any remote volume can persist data across containers. What drive9 adds is **instant, zero-copy forks**: `drive9 ctx fork` creates an isolated copy of your entire workspace in under a second. Break things on the fork, switch back, original untouched. No snapshots, no full copies, no waiting.

This is the core of the demo — three sandboxes, each building on the last, and then a fork that proves isolation without any data duplication.

| | Daytona alone | Daytona + drive9 |
|---|---|---|
| **Data survives sandbox death** | Only with external volumes | Built-in — just `drive9 mount` |
| **Continue work in a new sandbox** | Re-clone or restore from snapshot | Mount and go — full history is there |
| **Safe experimentation** | Destroy and recreate sandbox | `ctx fork` — instant, isolated, reversible |
| **git, node, grep** | Work on local sandbox disk | Work on persistent mount (real filesystem) |

## The demo

### Phase 1 — Sandbox A bootstraps a project

A fresh sandbox mounts drive9, initializes a git repo, writes a small Node.js project, runs it, and commits. Then the sandbox is destroyed.

### Phase 2 — Sandbox B continues development

A new sandbox mounts the same drive9 workspace. `git log` shows Sandbox A's commit — even though A no longer exists. It adds a `multiply` function, commits, verifies, and is destroyed.

### Phase 3 — Sandbox C forks and breaks things

A third sandbox sees the full history from A and B. It creates an instant fork with `drive9 ctx fork`, mounts the fork at a separate path, and deletes a critical file — breaking the fork. It switches back to the original and proves everything is intact. Then it too is destroyed.

All three sandboxes are gone. The project and every commit persist on drive9.

<details>
<summary><strong>Sample output</strong> (click to expand)</summary>

```
=== drive9 + Daytona: Code Survives Sandbox Death ===

── Phase 1: Sandbox A — Bootstrap a project ─────────────
[sandbox-a] Sandbox created: a1b2c3d4-...

== sandbox-a: git init project ==
Initialized empty Git repository

== sandbox-a: create math.js ==
== sandbox-a: create index.js ==
== sandbox-a: node index.js ==
add(1, 2) = 3

== sandbox-a: git commit ==
[main (root-commit) f3a1b2c] init: add module

>>> Sandbox A destroyed. <<<

── Phase 2: Sandbox B — Continue development ────────────
[sandbox-b] Sandbox created: e5f6a7b8-...

== sandbox-b: git log (see A's commit) ==
f3a1b2c init: add module

== sandbox-b: node index.js ==
add(1, 2) = 3
multiply(3, 4) = 12

== sandbox-b: git commit ==
[main d4e5f6a] feat: add multiply

>>> Sandbox B destroyed. <<<

── Phase 3: Sandbox C — Fork → break → prove isolation ──
[sandbox-c] Sandbox created: c9d0e1f2-...

== sandbox-c: git log (A + B commits survived) ==
d4e5f6a feat: add multiply
f3a1b2c init: add module

== sandbox-c: drive9 ctx fork (instant) ==
== sandbox-c: rm math.js on fork (destructive!) ==
== sandbox-c: node index.js on fork (expect failure) ==
Error: Cannot find module './math.js'

== sandbox-c: cat math.js on original (untouched!) ==
export function add(a, b) { return a + b }
export function multiply(a, b) { return a * b }

== sandbox-c: node index.js on original (still works!) ==
add(1, 2) = 3
multiply(3, 4) = 12

>>> Sandbox C destroyed. <<<

=== DEMO PASSED ===
```

</details>

## Quick start

```bash
git clone https://github.com/drive9-ai/drive9-for-daytona.git
cd drive9-for-daytona

cp .env.example .env
# Edit .env — see below for required values

npm install
npm run test       # smoke test: mount + read/write
npm run demo       # full 3-sandbox demo
npm run animate    # terminal animation (no API keys needed)
```

### Environment variables

```bash
# Required
DAYTONA_API_KEY=dtn_...          # from https://app.daytona.io
DRIVE9_API_KEY=dat9_...          # from https://drive9.ai

# Optional (have sensible defaults)
DRIVE9_SERVER=https://api.drive9.ai
DRIVE9_REMOTE=:/daytona-demo     # remote path for the workspace
# DAYTONA_TARGET=us              # region override (us, eu, asia)
```

> **Note:** Daytona sandboxes on Tier 1/2 have restricted outbound network access. The demo requires Tier 3+ or a self-hosted Daytona instance so that the sandbox can reach `api.drive9.ai` at runtime. We've submitted a [whitelist request](https://github.com/daytonaio/sandbox-network-whitelist/pull/103) to make drive9 available on all tiers.

### Cleanup

Sandboxes are automatically cleaned up on success or failure (the demo uses a `finally` block). If the script is interrupted, check your [Daytona dashboard](https://app.daytona.io) for orphaned sandboxes.

## How it works

The sandbox image is built declaratively through Daytona's SDK — no Dockerfile or container registry needed:

```typescript
import { Daytona, Image } from '@daytonaio/sdk'

const image = Image.base('ubuntu:22.04').runCommands(
  'apt-get update && apt-get install -y fuse3 git curl nodejs npm ...',
  'curl -fsSL <drive9-release-url> -o /usr/local/bin/drive9 && chmod +x ...',
)

const sandbox = await daytona.create({
  image,
  envVars: { DRIVE9_API_KEY: '...' },
})
```

Inside the sandbox, drive9 provides a standard POSIX filesystem:

```bash
drive9 mount /workspace          # mount persistent workspace
cd /workspace/my-project
git log                          # full history from previous sandboxes
node index.js                    # code runs

drive9 ctx fork test-env         # instant isolated fork
drive9 ctx use test-env          # switch to fork
rm important-file.js             # break things safely
drive9 ctx use default           # switch back — original untouched
```

## Files

| File | Purpose |
|---|---|
| `lib.ts` | Shared helpers — sandbox lifecycle, drive9 mount, command execution |
| `demo.ts` | Full 3-sandbox demo: bootstrap → continue → fork/break |
| `test.ts` | Smoke test: mount + read/write round-trip |
| `animate.ts` | Terminal animation of the demo flow (no API keys needed) |

## Prerequisites

- Node.js 20+
- [Daytona API key](https://app.daytona.io) (Tier 3+ for network access)
- [drive9 API key](https://drive9.ai)

## Links

- [drive9](https://drive9.ai) — persistent filesystem for AI agents
- [Daytona](https://daytona.io) — secure infrastructure for running AI-generated code
- [Whitelist PR](https://github.com/daytonaio/sandbox-network-whitelist/pull/103) — requesting drive9 access on all Daytona tiers

## License

MIT
