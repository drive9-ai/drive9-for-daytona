# drive9 + Daytona

> **Sandboxes are temporary. Your code is not.**

Three [Daytona](https://daytona.io) sandboxes are created and destroyed, one after another. The code, git history, and project survive every destruction — because they live on [drive9](https://drive9.ai), not on local disk.

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
  │                        drive9                                   │
  │              code + git history + forks                         │
  │                    persist here                                 │
  └─────────────────────────────────────────────────────────────────┘
```

## Why

Daytona gives you fast, secure sandboxes for running AI-generated code. But sandboxes are ephemeral — when they die, so does their data.

drive9 fixes that. Mount it inside any sandbox, and your filesystem outlives compute:

| | Without drive9 | With drive9 |
|---|---|---|
| **Data survives sandbox death** | No | Yes |
| **Share data across sandboxes** | Manual copy | Same mount |
| **git, node, grep just work** | Local disk only | Real filesystem |
| **Safe experimentation** | Snapshot entire sandbox | Instant fork |
| **Access from any machine** | Not possible | `drive9 mount` anywhere |

**Daytona manages compute. drive9 manages data.**

## The demo

### Phase 1 — Sandbox A bootstraps a project

A fresh sandbox initializes a git repo, writes a small Node.js project, runs it, and commits. Then the sandbox is destroyed.

### Phase 2 — Sandbox B continues development

A new sandbox mounts the same drive9 workspace. It sees Sandbox A's commit in `git log` — even though A no longer exists. It adds new functionality, commits, and is destroyed.

### Phase 3 — Sandbox C forks and breaks things

A third sandbox sees the full history from A and B. It creates an instant fork with `drive9 ctx fork`, deletes a critical file on the fork, and proves the original is completely untouched. Then it too is destroyed.

All three sandboxes are gone. The project, every commit, and the full git history persist on drive9 — accessible from any machine with `drive9 mount`.

## Quick start

```bash
git clone https://github.com/drive9-ai/drive9-for-daytona.git
cd drive9-for-daytona

cp .env.example .env
# Fill in DAYTONA_API_KEY and DRIVE9_API_KEY

npm install
npm run test       # smoke test: mount + read/write
npm run demo       # full 3-sandbox demo
npm run animate    # terminal animation (no API keys needed)
```

## How it works

The sandbox image is built declaratively through Daytona's SDK — no Dockerfile or container registry needed:

```typescript
const image = Image.base('ubuntu:22.04').runCommands(
  'apt-get update && apt-get install -y fuse3 git curl nodejs npm ...',
  'curl -fsSL <drive9-binary-url> -o /usr/local/bin/drive9 && chmod +x ...',
)

const sandbox = await daytona.create({
  image,
  envVars: { DRIVE9_API_KEY: '...' },
})
```

Once inside the sandbox, drive9 mounts a persistent filesystem:

```bash
drive9 mount /workspace          # mount shared workspace
cd /workspace/my-project
git log                          # full history from previous sandboxes
node index.js                    # code runs perfectly

drive9 ctx fork test-env         # instant fork for experiments
drive9 ctx use test-env          # switch to fork
rm important-file.js             # break things safely
drive9 ctx use default           # switch back — original untouched
```

## Files

| File | Purpose |
|---|---|
| `lib.ts` | Shared helpers — sandbox creation, drive9 mount, command execution |
| `demo.ts` | Full 3-sandbox demo: bootstrap → continue → fork/break |
| `test.ts` | Smoke test: mount + read/write round-trip |
| `animate.ts` | Terminal animation of the demo flow (no API keys needed) |

## Prerequisites

- Node.js 20+
- [Daytona API key](https://app.daytona.io) (Tier 3+ for full network access)
- [drive9 API key](https://drive9.ai)

## Links

- [drive9](https://drive9.ai) — persistent filesystem for AI agents
- [Daytona](https://daytona.io) — secure infrastructure for running AI-generated code
- [Daytona SDK](https://www.daytona.io/docs/en/typescript-sdk/sandbox/) — TypeScript SDK docs

## License

MIT
