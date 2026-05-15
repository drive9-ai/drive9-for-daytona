import 'dotenv/config'
import type { Sandbox } from '@daytonaio/sdk'
import {
  createSandbox,
  drive9ApiKey,
  drive9Remote,
  drive9Server,
  installDrive9,
  installFuse,
  killSandbox,
  mountDrive9,
  mountpoint,
  requireDrive9Credential,
  run,
  runAllowFail,
  shellQuote,
  unmountDrive9,
} from './lib'

requireDrive9Credential()

const projectName = process.env.DEMO_PROJECT || 'my-project'
const projectDir = `${mountpoint}/${projectName}`
const forkMountpoint = '/home/daytona/workspace-fork'
const forkProjectDir = `${forkMountpoint}/${projectName}`
const forkName = `test-env-${Date.now()}`

let sandboxA: Sandbox | undefined
let sandboxB: Sandbox | undefined
let sandboxC: Sandbox | undefined

console.log('=== drive9 + Daytona: Code Survives Sandbox Death ===\n')
console.log(`drive9 server:  ${drive9Server}`)
console.log(`drive9 remote:  ${drive9Remote}`)
console.log(`Project:        ${projectName}`)

try {
  // ── Phase 1: Sandbox A — Bootstrap a project ───────────────────────
  console.log('\n── Phase 1: Sandbox A — Bootstrap a project ─────────────')
  sandboxA = await createSandbox('sandbox-a')
  await installFuse(sandboxA, 'sandbox-a')
  await installDrive9(sandboxA, 'sandbox-a')
  await mountDrive9(sandboxA, 'sandbox-a')

  // Initialize a real project with git
  await run(
    sandboxA,
    'sandbox-a',
    'git init project',
    `mkdir -p ${shellQuote(projectDir)} && cd ${shellQuote(projectDir)} && ` +
      `git init && ` +
      `git config user.email "sandbox-a@demo" && ` +
      `git config user.name "Sandbox A"`,
  )

  await run(
    sandboxA,
    'sandbox-a',
    'create math.js',
    `cat > ${shellQuote(projectDir + '/math.js')} << 'EOF'
export function add(a, b) { return a + b }
EOF`,
  )

  await run(
    sandboxA,
    'sandbox-a',
    'create index.js',
    `cat > ${shellQuote(projectDir + '/index.js')} << 'EOF'
import { add } from "./math.js"
console.log("add(1, 2) =", add(1, 2))
EOF`,
  )

  await run(
    sandboxA,
    'sandbox-a',
    'create package.json',
    `cat > ${shellQuote(projectDir + '/package.json')} << 'EOF'
{ "name": "my-project", "type": "module" }
EOF`,
  )

  // Run the code to prove it works
  await run(
    sandboxA,
    'sandbox-a',
    'node index.js',
    `cd ${shellQuote(projectDir)} && node index.js`,
  )

  // Commit
  await run(
    sandboxA,
    'sandbox-a',
    'git commit',
    `cd ${shellQuote(projectDir)} && git add -A && git commit -m "init: add module"`,
  )

  await run(
    sandboxA,
    'sandbox-a',
    'git log',
    `cd ${shellQuote(projectDir)} && git log --oneline`,
  )

  // Destroy Sandbox A
  await unmountDrive9(sandboxA, 'sandbox-a')
  await killSandbox(sandboxA, 'sandbox-a')
  sandboxA = undefined
  console.log('\n>>> Sandbox A destroyed. <<<')

  // ── Phase 2: Sandbox B — Continue development (seamless handoff) ───
  console.log('\n── Phase 2: Sandbox B — Continue development ────────────')
  sandboxB = await createSandbox('sandbox-b')
  await installFuse(sandboxB, 'sandbox-b')
  await installDrive9(sandboxB, 'sandbox-b')
  await mountDrive9(sandboxB, 'sandbox-b')

  // See Sandbox A's work
  await run(
    sandboxB,
    'sandbox-b',
    'git log (see A\'s commit)',
    `cd ${shellQuote(projectDir)} && git log --oneline`,
  )

  // Add new functionality
  await run(
    sandboxB,
    'sandbox-b',
    'add multiply to math.js',
    `cat >> ${shellQuote(projectDir + '/math.js')} << 'EOF'
export function multiply(a, b) { return a * b }
EOF`,
  )

  await run(
    sandboxB,
    'sandbox-b',
    'update index.js',
    `cat > ${shellQuote(projectDir + '/index.js')} << 'EOF'
import { add, multiply } from "./math.js"
console.log("add(1, 2) =", add(1, 2))
console.log("multiply(3, 4) =", multiply(3, 4))
EOF`,
  )

  // Run to verify
  await run(
    sandboxB,
    'sandbox-b',
    'node index.js',
    `cd ${shellQuote(projectDir)} && node index.js`,
  )

  // Commit
  await run(
    sandboxB,
    'sandbox-b',
    'git commit',
    `cd ${shellQuote(projectDir)} && ` +
      `git config user.email "sandbox-b@demo" && ` +
      `git config user.name "Sandbox B" && ` +
      `git add -A && git commit -m "feat: add multiply"`,
  )

  await run(
    sandboxB,
    'sandbox-b',
    'git log (both commits)',
    `cd ${shellQuote(projectDir)} && git log --oneline`,
  )

  // Destroy Sandbox B
  await unmountDrive9(sandboxB, 'sandbox-b')
  await killSandbox(sandboxB, 'sandbox-b')
  sandboxB = undefined
  console.log('\n>>> Sandbox B destroyed. <<<')

  // ── Phase 3: Sandbox C — Fork, break things, prove isolation ───────
  console.log('\n── Phase 3: Sandbox C — Fork → break → prove isolation ──')
  sandboxC = await createSandbox('sandbox-c')
  await installFuse(sandboxC, 'sandbox-c')
  await installDrive9(sandboxC, 'sandbox-c')
  await mountDrive9(sandboxC, 'sandbox-c')

  // See both commits
  await run(
    sandboxC,
    'sandbox-c',
    'git log (A + B commits survived)',
    `cd ${shellQuote(projectDir)} && git log --oneline`,
  )

  // Create a copy-on-write fork
  await run(
    sandboxC,
    'sandbox-c',
    'drive9 ctx fork (instant CoW)',
    `time drive9 ctx fork ${shellQuote(forkName)} --json`,
    60,
  )

  // Show current context
  await run(
    sandboxC,
    'sandbox-c',
    'drive9 ctx show',
    `drive9 ctx show`,
  )

  // Switch to fork context and mount separately
  await run(
    sandboxC,
    'sandbox-c',
    'drive9 ctx use (switch to fork)',
    `drive9 ctx use ${shellQuote(forkName)}`,
  )

  await run(
    sandboxC,
    'sandbox-c',
    'drive9 ctx show (now on fork)',
    `drive9 ctx show`,
  )

  // Mount fork at a different path
  await mountDrive9(sandboxC, 'sandbox-c', drive9Remote, forkMountpoint)

  // Verify fork has the data
  await run(
    sandboxC,
    'sandbox-c',
    'cat math.js on fork (data copied)',
    `cat ${shellQuote(forkProjectDir + '/math.js')}`,
  )

  // Destructive experiment on fork
  await run(
    sandboxC,
    'sandbox-c',
    'rm math.js on fork (destructive!)',
    `rm ${shellQuote(forkProjectDir + '/math.js')}`,
  )

  // Run on fork — should fail
  await runAllowFail(
    sandboxC,
    'sandbox-c',
    'node index.js on fork (expect failure)',
    `cd ${shellQuote(forkProjectDir)} && node index.js 2>&1 || true`,
  )

  // Switch back to original context
  await run(
    sandboxC,
    'sandbox-c',
    'switch back to original',
    `drive9 ctx use default`,
  )

  // Prove original is untouched
  await run(
    sandboxC,
    'sandbox-c',
    'cat math.js on original (untouched!)',
    `cat ${shellQuote(projectDir + '/math.js')}`,
  )

  await run(
    sandboxC,
    'sandbox-c',
    'node index.js on original (still works!)',
    `cd ${shellQuote(projectDir)} && node index.js`,
  )

  // Final git log — full history intact
  await run(
    sandboxC,
    'sandbox-c',
    'git log (full history intact)',
    `cd ${shellQuote(projectDir)} && git log --oneline`,
  )

  // Cleanup
  await unmountDrive9(sandboxC, 'sandbox-c', forkMountpoint)
  await unmountDrive9(sandboxC, 'sandbox-c')
  await killSandbox(sandboxC, 'sandbox-c')
  sandboxC = undefined
  console.log('\n>>> Sandbox C destroyed. <<<')

  // ── Summary ────────────────────────────────────────────────────────
  console.log('\n=== DEMO PASSED ===')
  console.log('Code survived the death of 3 sandboxes:')
  console.log('  1. Sandbox A: bootstrapped project + first commit')
  console.log('  2. Sandbox B: continued development + second commit')
  console.log('  3. Sandbox C: forked → broke the fork → original untouched')
  console.log('')
  console.log('All sandboxes destroyed. Project + git history persist on drive9.')
  console.log('Mount from any machine: drive9 mount ~/drive9')
} finally {
  await Promise.allSettled([
    killSandbox(sandboxA, 'sandbox-a'),
    killSandbox(sandboxB, 'sandbox-b'),
    killSandbox(sandboxC, 'sandbox-c'),
  ])
}
