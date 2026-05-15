import { Daytona, type Sandbox } from '@daytonaio/sdk'

export const drive9Server = process.env.DRIVE9_SERVER || 'https://api.drive9.ai'
export const drive9Remote = process.env.DRIVE9_REMOTE || ':/daytona-demo'
export const drive9ApiKey = process.env.DRIVE9_API_KEY || ''
export const mountpoint = '/home/daytona/workspace'
const daytonaTarget = process.env.DAYTONA_TARGET || ''

// Custom sandbox image with drive9, fuse3, and git pre-installed.
const sandboxImage =
  process.env.DAYTONA_IMAGE || 'ghcr.io/drive9-ai/drive9-for-daytona/sandbox:latest'

export function requireDrive9Credential() {
  if (!drive9ApiKey) {
    throw new Error('DRIVE9_API_KEY is required')
  }
}

export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

let daytonaClient: Daytona | null = null

function getDaytona(): Daytona {
  if (!daytonaClient) {
    const opts: Record<string, string> = {}
    if (daytonaTarget) opts.target = daytonaTarget
    daytonaClient = new Daytona(opts)
  }
  return daytonaClient
}

export async function createSandbox(
  name: string,
  extraEnvs?: Record<string, string>,
): Promise<Sandbox> {
  const daytona = getDaytona()
  const sandbox = await daytona.create({
    image: sandboxImage,
    language: 'typescript',
    user: 'root',
    envVars: {
      DRIVE9_SERVER: drive9Server,
      DRIVE9_REMOTE: drive9Remote,
      DRIVE9_API_KEY: drive9ApiKey,
      DRIVE9_MOUNTPOINT: mountpoint,
      ...extraEnvs,
    },
    resources: { cpu: 2, memory: 4, disk: 10 },
  })
  console.log(`[${name}] Sandbox created: ${sandbox.id}`)
  return sandbox
}

export async function run(
  sandbox: Sandbox,
  name: string,
  label: string,
  cmd: string,
  timeoutSec = 120,
) {
  console.log(`\n== ${name}: ${label} ==`)
  const result = await sandbox.process.executeCommand(cmd, undefined, timeoutSec)
  if (result.exitCode !== 0) {
    console.error(`stdout: ${result.result}`)
    throw new Error(`${name}: ${label} failed with exit ${result.exitCode}`)
  }
  if (result.result) console.log(result.result)
  return result
}

// Verify pre-installed tools in the custom sandbox image.
export async function installDrive9(sandbox: Sandbox, name: string) {
  await run(sandbox, name, 'verify drive9', 'drive9 --version')
}

export async function installFuse(sandbox: Sandbox, name: string) {
  await run(
    sandbox,
    name,
    'verify fuse3 + git',
    'fusermount3 --version && git --version && ' +
      '(grep -q user_allow_other /etc/fuse.conf || printf "user_allow_other\\n" >> /etc/fuse.conf)',
  )
}

export async function ensureRemoteDir(sandbox: Sandbox, name: string, remote: string) {
  if (remote === ':/') return
  const path = remote.replace(/^:\//, '')
  const parts = path.split('/').filter(Boolean)
  let cur = ':/'
  for (const part of parts) {
    cur = cur === ':/' ? `:/${part}` : `${cur}/${part}`
    await run(
      sandbox,
      name,
      `ensure remote dir ${cur}`,
      `drive9 fs stat ${shellQuote(cur)} > /dev/null 2>&1 || drive9 fs mkdir ${shellQuote(cur)}`,
    )
  }
}

export async function mountDrive9(sandbox: Sandbox, name: string, remote?: string, path?: string) {
  const targetRemote = remote ?? drive9Remote
  const targetPath = path ?? mountpoint
  await ensureRemoteDir(sandbox, name, targetRemote)

  const logFile = `/tmp/drive9-mount-${targetPath.replace(/\//g, '_')}.log`
  await run(
    sandbox,
    name,
    `mount drive9 at ${targetPath}`,
    `mkdir -p ${shellQuote(targetPath)} && ` +
      `chmod 0666 /dev/fuse 2>/dev/null || true && ` +
      `nohup drive9 mount ` +
      `-server ${shellQuote(drive9Server)} ` +
      `-cache-dir /tmp/drive9-cache ` +
      `-allow-other ` +
      `-sync-mode interactive ` +
      `${shellQuote(targetRemote)} ${shellQuote(targetPath)} ` +
      `> ${shellQuote(logFile)} 2>&1 &`,
  )

  await run(
    sandbox,
    name,
    `wait for mount at ${targetPath}`,
    `for i in $(seq 1 60); do
       mountpoint -q ${shellQuote(targetPath)} && exit 0
       sleep 0.5
     done
     echo 'mount timeout' >&2
     cat ${shellQuote(logFile)} >&2 2>/dev/null || true
     exit 1`,
    90,
  )
}

// Like run() but does not throw on non-zero exit — returns the result for inspection.
export async function runAllowFail(
  sandbox: Sandbox,
  name: string,
  label: string,
  cmd: string,
  timeoutSec = 120,
) {
  console.log(`\n== ${name}: ${label} ==`)
  const result = await sandbox.process.executeCommand(cmd, undefined, timeoutSec)
  if (result.result) console.log(result.result)
  if (result.exitCode !== 0) {
    console.log(`[${name}] ${label} exited with code ${result.exitCode} (expected)`)
  }
  return result
}

export async function unmountDrive9(sandbox: Sandbox, name: string, path?: string) {
  const targetPath = path ?? mountpoint
  await run(
    sandbox,
    name,
    `unmount drive9 at ${targetPath}`,
    `drive9 umount --timeout 30s ${shellQuote(targetPath)}`,
  )
}

export async function killSandbox(sandbox: Sandbox | undefined, name: string) {
  if (!sandbox) return
  try {
    await sandbox.delete()
    console.log(`[${name}] Sandbox deleted.`)
  } catch (err) {
    console.error(`[${name}] Failed to delete sandbox:`, err)
  }
}
