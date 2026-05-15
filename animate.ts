#!/usr/bin/env npx tsx
/**
 * Terminal animation: drive9 + Daytona demo
 *
 * Usage:
 *   npx tsx animate.ts          # normal speed
 *   npx tsx animate.ts --fast   # 2x speed (for preview)
 */

const fast = process.argv.includes('--fast')
const speed = fast ? 0.5 : 1

// ── ANSI helpers ─────────────────────────────────────────────────────

const ESC = '\x1b'
const CSI = `${ESC}[`
const reset   = `${CSI}0m`
const bold    = `${CSI}1m`
const dim     = `${CSI}2m`
const italic  = `${CSI}3m`
const cyan    = `${CSI}36m`
const green   = `${CSI}32m`
const yellow  = `${CSI}33m`
const magenta = `${CSI}35m`
const blue    = `${CSI}34m`
const white   = `${CSI}97m`
const gray    = `${CSI}90m`
const bgCyan  = `${CSI}46m`
const bgGreen = `${CSI}42m`
const bgBlue  = `${CSI}44m`
const bgMag   = `${CSI}45m`
const clear   = `${CSI}2J${CSI}H`

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms * speed))
}

async function typeText(text: string, charDelay = 25): Promise<void> {
  for (const ch of text) {
    process.stdout.write(ch)
    await sleep(charDelay)
  }
}

async function typeLine(text: string, charDelay = 25): Promise<void> {
  await typeText(text, charDelay)
  process.stdout.write('\n')
}

function printInstant(text: string): void {
  process.stdout.write(text + '\n')
}

async function pause(ms = 800): Promise<void> {
  await sleep(ms)
}

async function progressBar(label: string, durationMs = 1500, width = 30): Promise<void> {
  const steps = width
  const stepDelay = durationMs / steps
  process.stdout.write(`  ${dim}${label} ${reset}[`)
  for (let i = 0; i < steps; i++) {
    const pct = Math.round(((i + 1) / steps) * 100)
    const filled = '='.repeat(i + 1)
    const empty = ' '.repeat(steps - i - 1)
    process.stdout.write(`\r  ${dim}${label} ${reset}[${green}${filled}>${reset}${empty}] ${pct}%`)
    await sleep(stepDelay)
  }
  process.stdout.write(`\r  ${dim}${label} ${reset}[${green}${'='.repeat(steps)}${reset}] ${bold}done${reset}\n`)
}

async function spinner(label: string, durationMs = 1200): Promise<void> {
  const frames = ['|', '/', '-', '\\']
  const interval = 80
  const iterations = Math.floor(durationMs / interval)
  for (let i = 0; i < iterations; i++) {
    process.stdout.write(`\r  ${cyan}${frames[i % frames.length]}${reset} ${label}`)
    await sleep(interval)
  }
  process.stdout.write(`\r  ${green}*${reset} ${label} ${green}ok${reset}\n`)
}

async function cmdPrompt(cmd: string, delay = 600): Promise<void> {
  process.stdout.write(`${gray}$ ${reset}`)
  await typeText(`${white}${cmd}${reset}`, 18)
  process.stdout.write('\n')
  await sleep(delay)
}

function banner(text: string, color = bgCyan): void {
  const pad = 2
  const line = ' '.repeat(pad) + text + ' '.repeat(pad)
  const border = ' '.repeat(line.length)
  printInstant(`\n${color}${bold}${border}${reset}`)
  printInstant(`${color}${bold}${line}${reset}`)
  printInstant(`${color}${bold}${border}${reset}\n`)
}

function sectionHeader(text: string): void {
  const line = '─'.repeat(60)
  printInstant(`\n${cyan}${line}${reset}`)
  printInstant(`${cyan}  ${bold}${text}${reset}`)
  printInstant(`${cyan}${line}${reset}\n`)
}

// ── Animation scenes ─────────────────────────────────────────────────

async function sceneIntro(): Promise<void> {
  process.stdout.write(clear)
  await pause(400)

  banner('  drive9 + Daytona  ', bgCyan)
  await pause(300)
  await typeLine(`${dim}  Persistent shared workspace for ephemeral sandboxes${reset}`, 20)
  await typeLine(`${dim}  with copy-on-write forks for isolated testing${reset}`, 20)
  await pause(1000)
}

async function sceneArchitecture(): Promise<void> {
  sectionHeader('Architecture')
  await pause(300)

  const lines = [
    `${bold}${white}  Three sandboxes. One shared filesystem. Zero interference.${reset}`,
    ``,
    `${yellow}  Sandbox A ${dim}(Code Gen)${reset}`,
    `${dim}     |  git clone + LLM analysis + ctx fork${reset}`,
    `${dim}     |  writes to drive9 FUSE mount${reset}`,
    `${dim}     v  ${yellow}destroyed${reset}`,
    ``,
    `${dim}     ┌──────────────┬──────────────┐${reset}`,
    `${dim}     │              │              │${reset}`,
    `${green}  Sandbox B       ${blue}Sandbox C${reset}`,
    `${green}  ${dim}(Tester)         ${blue}${dim}(Developer)${reset}`,
    `${green}  mount ${bold}FORK      ${blue}mount ${bold}ORIGINAL${reset}`,
    `${green}  run tests       ${blue}add features${reset}`,
    `${green}  ${dim}isolated!        ${blue}${dim}unblocked!${reset}`,
    ``,
    `${dim}     ┌──────────────────────────────┐${reset}`,
    `${dim}     │  ${magenta}${bold}drive9 server${reset}${dim}                 │${reset}`,
    `${dim}     │  original + fork both persist │${reset}`,
    `${dim}     └──────────────┬───────────────┘${reset}`,
    `${dim}                    │${reset}`,
    `${white}              Local macOS${reset}`,
    `${dim}              WebDAV mount${reset}`,
    `${dim}              same data, no FUSE${reset}`,
  ]

  for (const line of lines) {
    printInstant(line)
    await sleep(120)
  }
  await pause(1500)
}

async function scenePhase1(): Promise<void> {
  sectionHeader('Phase 1: Sandbox A - Code Generation')
  await pause(300)

  await cmdPrompt('daytona sandbox create --name sandbox-a')
  await spinner('Creating sandbox', 1000)
  printInstant(`  ${dim}ID: sb_a7f3k9x2  CPU: 2  RAM: 4GB  Disk: 10GB${reset}`)
  await pause(400)

  await cmdPrompt('drive9 mount /workspace')
  await spinner('Mounting drive9 FUSE filesystem', 800)
  await pause(300)

  await cmdPrompt('git clone https://github.com/drive9-ai/drive9-for-daytona /workspace/demo/project')
  await progressBar('Cloning', 1200)
  printInstant(`  ${dim}Cloning into '/workspace/demo/project'...${reset}`)
  printInstant(`  ${dim}Receiving objects: 100% (42/42), 18.5 KiB, done.${reset}`)
  await pause(500)

  await cmdPrompt('curl -X POST llm-api/chat/completions ...')
  await spinner('LLM analyzing code structure', 1500)
  printInstant(`  ${dim}Generated: /workspace/demo/analysis/code-summary.md${reset}`)
  await pause(300)

  printInstant(`\n${white}  code-summary.md:${reset}`)
  const summaryLines = [
    `${dim}  ## Project Purpose${reset}`,
    `${dim}  Daytona + drive9 demo: shared filesystem with CoW forks${reset}`,
    `${dim}  ## Main Files${reset}`,
    `${dim}  lib.ts, demo.ts, test.ts, README.md${reset}`,
    `${dim}  ## Architecture${reset}`,
    `${dim}  3 sandboxes, FUSE mount, copy-on-write fork isolation${reset}`,
  ]
  for (const line of summaryLines) {
    printInstant(line)
    await sleep(80)
  }
  await pause(600)
}

async function sceneFork(): Promise<void> {
  sectionHeader('Fork: Copy-on-Write Isolation')
  await pause(300)

  await cmdPrompt('drive9 ctx fork test-fork-1747288012')
  printInstant(`  ${dim}fork start: 2026-05-15T09:06:52Z${reset}`)
  await spinner('Creating copy-on-write fork', 600)
  printInstant(`  ${green}${bold}  Fork created in 0.3s${reset}`)
  printInstant(`  ${dim}  Only metadata copied - instant, zero data duplication${reset}`)
  printInstant(`  ${dim}fork done:  2026-05-15T09:06:52Z${reset}`)
  await pause(500)

  await cmdPrompt('drive9 fs ls demo/analysis/')
  printInstant(`  ${dim}code-summary.md    handoff.json${reset}`)
  await pause(400)

  printInstant(`\n${yellow}  Sandbox A destroyed.${reset}`)
  printInstant(`${dim}  Fork and original both persist on drive9.${reset}`)
  await pause(800)
}

async function scenePhase2(): Promise<void> {
  sectionHeader('Phase 2: Parallel Sandboxes')
  await pause(300)

  printInstant(`  ${green}${bold}Sandbox B${reset} ${dim}(Tester)${reset}  +  ${blue}${bold}Sandbox C${reset} ${dim}(Developer)${reset}  ${white}${bold}launching in parallel${reset}`)
  await pause(300)

  await cmdPrompt('daytona sandbox create --name sandbox-b & daytona sandbox create --name sandbox-c &')
  await Promise.all([
    spinner('sandbox-b: creating', 900),
  ])
  await spinner('sandbox-c: creating', 300)
  await pause(200)

  // Sandbox B
  printInstant(`\n${green}${bold}  ┌─ Sandbox B: Tester (mounts FORK) ──────────────────┐${reset}`)
  await pause(200)

  await cmdPrompt('drive9 mount /workspace  # fork context')
  await spinner('Mounting forked workspace', 600)

  await cmdPrompt('cat /workspace/demo/analysis/handoff.json')
  printInstant(`  ${dim}{ "created_by": "sandbox-a", "fork_name": "test-fork-..." }${reset}`)
  await pause(300)

  await cmdPrompt('npm test')
  await progressBar('Running tests', 1000, 25)
  printInstant(`  ${green}${bold}  All 4 tests passed${reset}`)
  printInstant(`  ${dim}  shellQuote .......... PASS (2ms)${reset}`)
  printInstant(`  ${dim}  requireCredential ... PASS (1ms)${reset}`)
  printInstant(`  ${dim}  fallback ............ PASS (5ms)${reset}`)
  printInstant(`  ${dim}  mount+write+read .... PASS (340ms)${reset}`)
  await pause(300)

  printInstant(`  ${dim}Generated: test-report.md${reset}`)
  printInstant(`${green}${bold}  └─────────────────────────────────────────────────────┘${reset}`)
  await pause(400)

  // Sandbox C
  printInstant(`\n${blue}${bold}  ┌─ Sandbox C: Developer (mounts ORIGINAL) ───────────┐${reset}`)
  await pause(200)

  await cmdPrompt('drive9 mount /workspace  # original context')
  await spinner('Mounting original workspace', 600)

  await cmdPrompt('ls /workspace/demo/project/')
  printInstant(`  ${dim}README.md  demo.ts  lib.ts  package.json  test.ts  tsconfig.json${reset}`)
  await pause(300)

  await cmdPrompt('echo "Development notes..." > /workspace/demo/analysis/dev-notes.md')
  printInstant(`  ${dim}Written: dev-notes.md (only on original, fork can't see this)${reset}`)
  printInstant(`${blue}${bold}  └─────────────────────────────────────────────────────┘${reset}`)
  await pause(600)
}

async function sceneIsolation(): Promise<void> {
  sectionHeader('Isolation Proof')
  await pause(300)

  printInstant(`  ${bold}${white}Sandbox B (fork):${reset}`)
  printInstant(`    ${dim}code-summary.md  handoff.json  ${green}test-report.md${reset}`)
  printInstant(`    ${dim}${italic}(no dev-notes.md - fork is isolated)${reset}`)
  await pause(400)

  printInstant(`\n  ${bold}${white}Sandbox C (original):${reset}`)
  printInstant(`    ${dim}code-summary.md  handoff.json  ${blue}dev-notes.md${reset}`)
  printInstant(`    ${dim}${italic}(no test-report.md - tests ran on fork)${reset}`)
  await pause(600)

  printInstant(`\n  ${magenta}${bold}drive9 server:${reset}`)
  printInstant(`    ${dim}Both workspaces persist independently.${reset}`)
  printInstant(`    ${dim}Accessible from any machine with the CLI.${reset}`)
  await pause(800)
}

async function sceneLocalMount(): Promise<void> {
  sectionHeader('Phase 3: Local macOS — Data Survives Sandbox Destruction')
  await pause(300)

  printInstant(`  ${yellow}All Daytona sandboxes destroyed.${reset}`)
  printInstant(`  ${dim}But the data lives on drive9 — accessible from anywhere.${reset}`)
  await pause(500)

  printInstant(`\n  ${white}${bold}On your local macOS:${reset}`)
  await pause(200)

  await cmdPrompt('drive9 mount ~/drive9')
  await spinner('Mounting via WebDAV (macOS native)', 800)
  printInstant(`  ${dim}Mounted at ~/drive9 (Finder-visible, no FUSE needed)${reset}`)
  await pause(400)

  await cmdPrompt('ls ~/drive9/daytona-demo/demo/analysis/')
  const files = [
    `  ${dim}code-summary.md${reset}   ${gray}← generated by LLM in Sandbox A${reset}`,
    `  ${dim}handoff.json${reset}      ${gray}← metadata from Sandbox A${reset}`,
    `  ${dim}test-report.md${reset}    ${gray}← written by Sandbox B (fork)${reset}`,
    `  ${dim}dev-notes.md${reset}      ${gray}← written by Sandbox C (original)${reset}`,
  ]
  for (const line of files) {
    printInstant(line)
    await sleep(200)
  }
  await pause(400)

  await cmdPrompt('cat ~/drive9/daytona-demo/demo/analysis/test-report.md')
  printInstant(`  ${dim}# Test Report${reset}`)
  printInstant(`  ${dim}**Status:** ALL TESTS PASSED${reset}`)
  printInstant(`  ${dim}Tests ran on a forked drive9 workspace...${reset}`)
  await pause(400)

  await cmdPrompt('open ~/drive9/daytona-demo/demo/project')
  printInstant(`  ${dim}(Opens in Finder / VS Code — full POSIX access)${reset}`)
  await pause(600)

  printInstant(`\n  ${magenta}${bold}Key insight:${reset}`)
  printInstant(`  ${white}Daytona sandbox → destroyed. Data → still here.${reset}`)
  printInstant(`  ${white}Linux FUSE mount, macOS WebDAV mount, same data.${reset}`)
  printInstant(`  ${dim}No vendor lock-in. No platform-specific storage.${reset}`)
  await pause(1000)
}

async function sceneWhy(): Promise<void> {
  sectionHeader('Why drive9 + Daytona')
  await pause(300)

  const rows = [
    ['Capability',                     'Daytona Volumes', 'drive9'],
    ['Persist across sandboxes',       'Yes',             'Yes'],
    ['Access from non-Daytona machines','No',             'Yes (any OS)'],
    ['POSIX fs (git, grep, vim)',      'No (API only)',   'Yes (FUSE)'],
    ['Copy-on-write fork',            'No',              'Yes (ctx fork)'],
    ['Cross-platform',                'No',              'Yes'],
  ]

  // Print table
  const colWidths = [35, 18, 18]
  const separator = `  ${dim}${'─'.repeat(colWidths[0] + 2)}┬${'─'.repeat(colWidths[1] + 2)}┬${'─'.repeat(colWidths[2] + 2)}${reset}`

  // Header
  const hdr = rows[0]
  printInstant(`  ${bold}${white}${hdr[0].padEnd(colWidths[0])}${reset}  ${bold}${hdr[1].padEnd(colWidths[1])}${reset}  ${bold}${hdr[2].padEnd(colWidths[2])}${reset}`)
  printInstant(separator)
  await sleep(200)

  // Data rows
  for (let i = 1; i < rows.length; i++) {
    const [cap, vol, d9] = rows[i]
    const volColor = vol.startsWith('No') ? `${dim}` : `${green}`
    const d9Color = d9.startsWith('No') ? `${dim}` : `${green}${bold}`
    printInstant(`  ${white}${cap.padEnd(colWidths[0])}${reset}  ${volColor}${vol.padEnd(colWidths[1])}${reset}  ${d9Color}${d9.padEnd(colWidths[2])}${reset}`)
    await sleep(250)
  }

  await pause(600)
  printInstant(`\n  ${italic}${dim}Your data isn't trapped in one platform.${reset}`)
  await pause(1000)
}

async function sceneOutro(): Promise<void> {
  printInstant('')
  banner('  DEMO COMPLETE  ', bgGreen)
  await pause(300)

  printInstant(`  ${bold}Three sandboxes. One filesystem. Zero lock-in.${reset}`)
  printInstant('')
  printInstant(`  ${dim}1.${reset} Sandbox A ${dim}(Daytona)${reset}: cloned repo + LLM analysis + forked workspace`)
  printInstant(`  ${dim}2.${reset} Sandbox B ${dim}(Daytona)${reset}: ran tests on isolated fork`)
  printInstant(`  ${dim}3.${reset} Sandbox C ${dim}(Daytona)${reset}: continued development on original`)
  printInstant(`  ${dim}4.${reset} Local macOS: mounted via WebDAV, all artifacts accessible`)
  printInstant('')
  printInstant(`  ${dim}All sandboxes destroyed. Data persists. Accessible from anywhere.${reset}`)
  printInstant('')
  printInstant(`  ${cyan}${bold}https://github.com/drive9-ai/drive9-for-daytona${reset}`)
  printInstant(`  ${cyan}${bold}https://drive9.ai${reset}`)
  printInstant('')
}

// ── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  await sceneIntro()
  await sceneArchitecture()
  await scenePhase1()
  await sceneFork()
  await scenePhase2()
  await sceneIsolation()
  await sceneLocalMount()
  await sceneWhy()
  await sceneOutro()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
