# drive9 + Daytona

> **Sandboxes are temporary. Your code is not.**

Three [Daytona](https://daytona.io) sandboxes are created and destroyed, one after another. The code, git history, and project survive every destruction — because they live on [drive9](https://drive9.ai), a persistent cloud filesystem.

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
| **Data survives sandbox death** | Re-clone or restore from snapshot | `drive9 mount` — zero-config, full history |
| **Safe experimentation** | Destroy and recreate sandbox | `ctx fork` — instant, isolated, reversible |
| **git, node, grep** | Work on local sandbox disk | Work on persistent mount (real POSIX filesystem) |

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

> **Important:** The demo requires Daytona **Tier 3+** or a self-hosted instance. Tier 1/2 sandboxes block outbound HTTPS to `api.drive9.ai`. We've submitted a [whitelist request](https://github.com/daytonaio/sandbox-network-whitelist/pull/103) to enable all tiers.

```bash
git clone https://github.com/drive9-ai/drive9-for-daytona.git
cd drive9-for-daytona

cp .env.example .env
# Fill in your API keys:
#   DAYTONA_API_KEY=dtn_...       from https://app.daytona.io
#   DRIVE9_API_KEY=dat9_...       run: drive9 ctx show --reveal

npm install
npm run demo       # full 3-sandbox demo
```

## How it works

Inside each sandbox, drive9 provides a standard POSIX mount:

```bash
drive9 mount /workspace            # mount persistent workspace
cd /workspace && git log            # full history from previous sandboxes
drive9 ctx fork test-env            # instant isolated fork
drive9 ctx use default              # switch back — original untouched
```

The sandbox image is built declaratively through Daytona's SDK — no Dockerfile needed. See [`lib.ts`](lib.ts) for implementation details.

## Prerequisites

- Node.js 20+
- [Daytona API key](https://app.daytona.io) — **Tier 3+ required** for network access
- [drive9 API key](https://drive9.ai) — or run `drive9 ctx show --reveal`

## Links

- [drive9](https://drive9.ai) — persistent cloud filesystem
- [Daytona](https://daytona.io) — secure infrastructure for running AI-generated code
- [Whitelist PR](https://github.com/daytonaio/sandbox-network-whitelist/pull/103) — requesting drive9 access on all Daytona tiers

## License

MIT
