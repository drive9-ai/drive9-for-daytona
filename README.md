# drive9-for-daytona

> **Code Survives Sandbox Death.**

Three Daytona sandboxes are created and destroyed, one by one. The code,
git history, and project survive every destruction — because they live on
**drive9**, not on sandbox local disk.

## What happens

```text
  Sandbox A (bootstrap)
  │  git init, write code, commit
  │  node index.js → 3
  ↓  destroyed

  Sandbox B (continue)
  │  git log → sees A's commit (A is dead)
  │  add features, commit
  │  node index.js → 3, 12
  ↓  destroyed

  Sandbox C (fork + break)
  │  git log → sees A + B commits (both dead)
  │  drive9 ctx fork test-env (0.3s, instant)
  │  rm math.js on fork → broken
  │  switch back → original untouched
  ↓  destroyed

  Local macOS
     drive9 mount ~/drive9
     git log, node index.js → everything works
     open . → browse in Finder
```

## Why drive9 + Daytona

Daytona provides fast, secure sandboxes for running AI-generated code.
drive9 adds the data layer:

| Capability | Without drive9 | With drive9 |
|---|---|---|
| Data survives sandbox death | No | Yes |
| Share data across sandboxes | Manual copy | Same `drive9 mount` |
| git, node, grep just work | Local disk only | Real filesystem |
| Safe experimentation | Snapshot entire sandbox | `ctx fork` (instant) |
| Access from any machine | Not possible | `drive9 mount` anywhere |

**Daytona manages compute. drive9 manages data.**

## Quick start

```bash
cp .env.example .env
# Fill in DAYTONA_API_KEY, DRIVE9_API_KEY

npm install
npm run test       # smoke test: mount + read/write round-trip
npm run demo       # full 3-sandbox demo
npm run animate    # terminal animation (no API keys needed)
```

## Files

| File | Purpose |
|---|---|
| `lib.ts` | Shared helpers: createSandbox, mountDrive9, run |
| `demo.ts` | 3-sandbox demo: bootstrap → continue → fork/break |
| `test.ts` | Mount + read/write smoke test |
| `animate.ts` | Terminal animation simulating the demo flow |

## Prerequisites

- Node.js 20+
- [Daytona API key](https://app.daytona.io)
- [drive9 API key](https://drive9.ai)

## License

MIT
