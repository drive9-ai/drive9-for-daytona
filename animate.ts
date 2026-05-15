#!/usr/bin/env npx tsx
/**
 * Terminal animation: drive9 + Daytona demo
 * "Code Survives Sandbox Death"
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
const red     = `${CSI}31m`
const white   = `${CSI}97m`
const gray    = `${CSI}90m`
const bgGreen = `${CSI}42m`
const bgCyan  = `${CSI}46m`
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

function print(text: string): void {
  process.stdout.write(text + '\n')
}

async function pause(ms = 800): Promise<void> {
  await sleep(ms)
}

async function cmdPrompt(prompt: string, cmd: string, delay = 400): Promise<void> {
  process.stdout.write(`${prompt} `)
  await typeText(`${white}${cmd}${reset}`, 18)
  process.stdout.write('\n')
  await sleep(delay)
}

function banner(text: string, color = bgCyan): void {
  const pad = 2
  const line = ' '.repeat(pad) + text + ' '.repeat(pad)
  const border = ' '.repeat(line.length)
  print(`\n${color}${bold}${border}${reset}`)
  print(`${color}${bold}${line}${reset}`)
  print(`${color}${bold}${border}${reset}\n`)
}

function section(text: string): void {
  const line = '─'.repeat(60)
  print(`\n${cyan}${line}${reset}`)
  print(`${cyan}  ${bold}${text}${reset}`)
  print(`${cyan}${line}${reset}\n`)
}

function sandboxPrompt(name: string): string {
  const colors: Record<string, string> = {
    'sandbox-a': yellow,
    'sandbox-b': green,
    'sandbox-c': blue,
    'local': magenta,
  }
  const color = colors[name] || white
  return `${color}${bold}${name}${reset} ${gray}$${reset}`
}

// ── Scenes ───────────────────────────────────────────────────────────

async function sceneIntro(): Promise<void> {
  process.stdout.write(clear)
  await pause(400)
  banner('  drive9 + Daytona  ', bgCyan)
  await pause(200)
  await typeLine(`${dim}  Code Survives Sandbox Death${reset}`, 30)
  await pause(300)
  await typeLine(`${dim}  3 ephemeral sandboxes. 1 persistent filesystem. Full git history.${reset}`, 20)
  await pause(1200)
}

async function sceneArchitecture(): Promise<void> {
  section('Architecture')
  await pause(200)

  const lines = [
    `${bold}${white}  3 sandboxes are created and destroyed, one by one.${reset}`,
    `${bold}${white}  The code and git history survive every destruction.${reset}`,
    ``,
    `${yellow}  Sandbox A ${dim}(bootstrap)${reset}      git init, write code, commit`,
    `${dim}     ↓ destroyed${reset}`,
    `${green}  Sandbox B ${dim}(continue)${reset}       git log shows A's commit, add features`,
    `${dim}     ↓ destroyed${reset}`,
    `${blue}  Sandbox C ${dim}(fork + break)${reset}   fork → rm file → original untouched`,
    `${dim}     ↓ destroyed${reset}`,
    `${magenta}  Local macOS ${dim}(access)${reset}      mount via WebDAV, open in Finder`,
    ``,
    `${dim}  ┌──────────────────────────────────────────┐${reset}`,
    `${dim}  │  ${magenta}${bold}drive9${reset}${dim}: data layer that outlives compute   │${reset}`,
    `${dim}  │  POSIX filesystem • git • copy-on-write   │${reset}`,
    `${dim}  └──────────────────────────────────────────┘${reset}`,
  ]

  for (const line of lines) {
    print(line)
    await sleep(120)
  }
  await pause(1200)
}

async function sceneSandboxA(): Promise<void> {
  section('Sandbox A — Bootstrap a project')
  await pause(200)

  const prompt = sandboxPrompt('sandbox-a')

  await cmdPrompt(prompt, 'drive9 mount /workspace')
  print(`  ${dim}Mounted at /workspace (FUSE)${reset}`)
  await pause(300)

  await cmdPrompt(prompt, 'mkdir my-project && cd my-project')
  await cmdPrompt(prompt, 'git init')
  print(`  ${dim}Initialized empty Git repository${reset}`)
  await pause(200)

  await cmdPrompt(prompt, 'cat > math.js')
  print(`  ${dim}export function add(a, b) { return a + b }${reset}`)
  await pause(200)

  await cmdPrompt(prompt, 'cat > index.js')
  print(`  ${dim}import { add } from "./math.js"${reset}`)
  print(`  ${dim}console.log("add(1, 2) =", add(1, 2))${reset}`)
  await pause(200)

  await cmdPrompt(prompt, 'node index.js')
  print(`  ${green}${bold}add(1, 2) = 3${reset}`)
  await pause(400)

  await cmdPrompt(prompt, 'git add -A && git commit -m "init: add module"')
  print(`  ${dim}[main (root-commit) a1b2c3d] init: add module${reset}`)
  print(`  ${dim} 3 files changed, 5 insertions(+)${reset}`)
  await pause(400)

  print(`\n${red}${bold}  >>> Sandbox A destroyed. <<<${reset}`)
  await pause(1000)
}

async function sceneSandboxB(): Promise<void> {
  section('Sandbox B — Continue development')
  await pause(200)

  const prompt = sandboxPrompt('sandbox-b')

  await cmdPrompt(prompt, 'drive9 mount /workspace')
  print(`  ${dim}Mounted at /workspace (FUSE)${reset}`)
  await pause(300)

  await cmdPrompt(prompt, 'cd my-project && git log --oneline')
  print(`  ${green}${bold}a1b2c3d${reset} init: add module     ${gray}← Sandbox A is dead. Its commit lives.${reset}`)
  await pause(800)

  await cmdPrompt(prompt, 'cat >> math.js  # add multiply')
  print(`  ${dim}export function multiply(a, b) { return a * b }${reset}`)
  await pause(200)

  await cmdPrompt(prompt, 'cat > index.js  # use both functions')
  print(`  ${dim}import { add, multiply } from "./math.js"${reset}`)
  print(`  ${dim}console.log("add(1, 2) =", add(1, 2))${reset}`)
  print(`  ${dim}console.log("multiply(3, 4) =", multiply(3, 4))${reset}`)
  await pause(200)

  await cmdPrompt(prompt, 'node index.js')
  print(`  ${green}${bold}add(1, 2) = 3${reset}`)
  print(`  ${green}${bold}multiply(3, 4) = 12${reset}`)
  await pause(400)

  await cmdPrompt(prompt, 'git add -A && git commit -m "feat: add multiply"')
  print(`  ${dim}[main e4f5a6b] feat: add multiply${reset}`)
  await pause(200)

  await cmdPrompt(prompt, 'git log --oneline')
  print(`  ${green}${bold}e4f5a6b${reset} feat: add multiply`)
  print(`  ${green}${bold}a1b2c3d${reset} init: add module`)
  await pause(400)

  print(`\n${red}${bold}  >>> Sandbox B destroyed. <<<${reset}`)
  await pause(1000)
}

async function sceneSandboxC(): Promise<void> {
  section('Sandbox C — Fork → break things → prove isolation')
  await pause(200)

  const prompt = sandboxPrompt('sandbox-c')

  await cmdPrompt(prompt, 'drive9 mount /workspace')
  print(`  ${dim}Mounted at /workspace (FUSE)${reset}`)
  await pause(200)

  await cmdPrompt(prompt, 'cd my-project && git log --oneline')
  print(`  ${green}${bold}e4f5a6b${reset} feat: add multiply   ${gray}← Both commits survived 2 sandbox deaths.${reset}`)
  print(`  ${green}${bold}a1b2c3d${reset} init: add module`)
  await pause(800)

  // Fork
  print(`\n${white}${bold}  Creating a copy-on-write fork...${reset}`)
  await pause(200)

  await cmdPrompt(prompt, 'drive9 ctx fork test-env')
  print(`  ${cyan}${bold}Context "test-env" created (fork of "default")${reset}`)
  print(`  ${dim}0.3s elapsed — only metadata copied, zero data duplication${reset}`)
  await pause(500)

  await cmdPrompt(prompt, 'drive9 ctx show')
  print(`  ${dim}name:   default${reset}`)
  print(`  ${dim}type:   owner${reset}`)
  print(`  ${dim}server: https://api.drive9.ai${reset}`)
  await pause(300)

  // Switch to fork
  await cmdPrompt(prompt, 'drive9 ctx use test-env')
  print(`  ${cyan}Switched to context: ${bold}test-env${reset}`)
  await pause(300)

  await cmdPrompt(prompt, 'drive9 mount /workspace-fork')
  print(`  ${dim}Mounted fork at /workspace-fork (FUSE)${reset}`)
  await pause(300)

  // Verify fork has data
  await cmdPrompt(prompt, 'cat /workspace-fork/my-project/math.js')
  print(`  ${dim}export function add(a, b) { return a + b }${reset}`)
  print(`  ${dim}export function multiply(a, b) { return a * b }${reset}`)
  print(`  ${gray}← Fork has all the data${reset}`)
  await pause(400)

  // Break it
  print(`\n${red}${bold}  Destructive experiment on the fork:${reset}`)
  await pause(200)

  await cmdPrompt(prompt, 'rm /workspace-fork/my-project/math.js')
  await pause(200)

  await cmdPrompt(prompt, 'cd /workspace-fork/my-project && node index.js')
  print(`  ${red}${bold}Error: Cannot find module './math.js'${reset}`)
  print(`  ${gray}← Fork is broken.${reset}`)
  await pause(800)

  // Switch back
  print(`\n${white}${bold}  Switch back to original:${reset}`)
  await pause(200)

  await cmdPrompt(prompt, 'drive9 ctx use default')
  print(`  ${cyan}Switched to context: ${bold}default${reset}`)
  await pause(300)

  await cmdPrompt(prompt, 'cat /workspace/my-project/math.js')
  print(`  ${green}export function add(a, b) { return a + b }${reset}`)
  print(`  ${green}export function multiply(a, b) { return a * b }${reset}`)
  print(`  ${green}${bold}← Original untouched!${reset}`)
  await pause(400)

  await cmdPrompt(prompt, 'cd /workspace/my-project && node index.js')
  print(`  ${green}${bold}add(1, 2) = 3${reset}`)
  print(`  ${green}${bold}multiply(3, 4) = 12${reset}`)
  print(`  ${green}${bold}← Still works perfectly.${reset}`)
  await pause(600)

  print(`\n${red}${bold}  >>> Sandbox C destroyed. <<<${reset}`)
  await pause(1000)
}

async function sceneLocalMac(): Promise<void> {
  section('Local macOS — Data outlives every sandbox')
  await pause(200)

  print(`  ${yellow}All 3 Daytona sandboxes destroyed.${reset}`)
  print(`  ${dim}But the code lives on drive9.${reset}`)
  await pause(500)

  const prompt = sandboxPrompt('local')

  await cmdPrompt(prompt, 'drive9 mount ~/drive9')
  print(`  ${dim}Mounted via WebDAV (macOS native, no FUSE needed)${reset}`)
  await pause(300)

  await cmdPrompt(prompt, 'cd ~/drive9/my-project && git log --oneline')
  print(`  ${green}${bold}e4f5a6b${reset} feat: add multiply`)
  print(`  ${green}${bold}a1b2c3d${reset} init: add module`)
  print(`  ${gray}← Full git history, on your laptop.${reset}`)
  await pause(400)

  await cmdPrompt(prompt, 'node index.js')
  print(`  ${green}${bold}add(1, 2) = 3${reset}`)
  print(`  ${green}${bold}multiply(3, 4) = 12${reset}`)
  await pause(300)

  await cmdPrompt(prompt, 'open .')
  print(`  ${dim}(Opens in Finder — browse, edit, run from macOS)${reset}`)
  await pause(600)

  print(`\n  ${magenta}${bold}Sandboxes are temporary. Your code is not.${reset}`)
  await pause(1000)
}

async function sceneOutro(): Promise<void> {
  banner('  DEMO COMPLETE  ', bgGreen)
  await pause(300)

  print(`  ${bold}3 sandboxes created and destroyed. Code + git history intact.${reset}`)
  print('')
  print(`  ${dim}1.${reset} ${yellow}Sandbox A${reset}: bootstrapped project, first commit`)
  print(`  ${dim}2.${reset} ${green}Sandbox B${reset}: continued development, second commit`)
  print(`  ${dim}3.${reset} ${blue}Sandbox C${reset}: forked, broke the fork, original untouched`)
  print(`  ${dim}4.${reset} ${magenta}Local macOS${reset}: mounted via WebDAV, everything accessible`)
  print('')
  print(`  ${dim}Daytona manages compute. drive9 manages data.${reset}`)
  print(`  ${dim}Together: the complete runtime for AI agents.${reset}`)
  print('')
  print(`  ${cyan}${bold}https://github.com/drive9-ai/drive9-for-daytona${reset}`)
  print(`  ${cyan}${bold}https://drive9.ai${reset}`)
  print('')
}

// ── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  await sceneIntro()
  await sceneArchitecture()
  await sceneSandboxA()
  await sceneSandboxB()
  await sceneSandboxC()
  await sceneLocalMac()
  await sceneOutro()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
