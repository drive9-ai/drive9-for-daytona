import { Daytona, type Sandbox } from '@daytonaio/sdk'

export const drive9Server = process.env.DRIVE9_SERVER || 'https://api.drive9.ai'
export const drive9Remote = process.env.DRIVE9_REMOTE || ':/daytona-demo'
export const drive9ApiKey = process.env.DRIVE9_API_KEY || ''
export const mountpoint = '/home/daytona/workspace'

const releaseBaseUrl = process.env.DRIVE9_RELEASE_BASE_URL || 'https://drive9.ai/releases'
const releaseVersion = process.env.DRIVE9_RELEASE_VERSION || 'latest'

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
    daytonaClient = new Daytona()
  }
  return daytonaClient
}

export async function createSandbox(
  name: string,
  extraEnvs?: Record<string, string>,
): Promise<Sandbox> {
  const daytona = getDaytona()
  const sandbox = await daytona.create({
    language: 'typescript',
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
  const result = await sandbox.process.executeCommand(cmd, undefined, undefined, timeoutSec)
  if (result.exitCode !== 0) {
    console.error(`stdout: ${result.result}`)
    throw new Error(`${name}: ${label} failed with exit ${result.exitCode}`)
  }
  if (result.result) console.log(result.result)
  return result
}

export async function installDrive9(sandbox: Sandbox, name: string) {
  await run(
    sandbox,
    name,
    'install drive9',
    `curl -fsSL '${releaseBaseUrl}/drive9-linux-amd64?v=${releaseVersion}' -o /usr/local/bin/drive9 && ` +
      `chmod +x /usr/local/bin/drive9 && ` +
      `drive9 --version`,
  )
}

export async function installFuse(sandbox: Sandbox, name: string) {
  await run(
    sandbox,
    name,
    'install fuse3',
    'apt-get update -qq && apt-get install -y -qq fuse3 > /dev/null 2>&1 && ' +
      'printf "user_allow_other\\n" > /etc/fuse.conf && ' +
      'fusermount3 --version',
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

export async function mountDrive9(sandbox: Sandbox, name: string, remote?: string) {
  const targetRemote = remote ?? drive9Remote
  await ensureRemoteDir(sandbox, name, targetRemote)

  await run(
    sandbox,
    name,
    'mount drive9',
    `mkdir -p ${shellQuote(mountpoint)} && ` +
      `chmod 0666 /dev/fuse 2>/dev/null || true && ` +
      `nohup drive9 mount ` +
      `-server ${shellQuote(drive9Server)} ` +
      `-cache-dir /tmp/drive9-cache ` +
      `-allow-other ` +
      `-sync-mode interactive ` +
      `${shellQuote(targetRemote)} ${shellQuote(mountpoint)} ` +
      `> /tmp/drive9-mount.log 2>&1 &`,
  )

  await run(
    sandbox,
    name,
    'wait for mount',
    `for i in $(seq 1 60); do
       mountpoint -q ${shellQuote(mountpoint)} && exit 0
       sleep 0.5
     done
     echo 'mount timeout' >&2
     cat /tmp/drive9-mount.log >&2 2>/dev/null || true
     exit 1`,
    90,
  )
}

export async function unmountDrive9(sandbox: Sandbox, name: string) {
  await run(
    sandbox,
    name,
    'unmount drive9',
    `drive9 umount --timeout 30s ${shellQuote(mountpoint)}`,
  )
}

export async function killSandbox(sandbox: Sandbox | undefined, name: string) {
  if (!sandbox) return
  try {
    await sandbox.delete(30)
    console.log(`[${name}] Sandbox deleted.`)
  } catch (err) {
    console.error(`[${name}] Failed to delete sandbox:`, err)
  }
}
