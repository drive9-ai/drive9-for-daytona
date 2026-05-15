import 'dotenv/config'
import {
  createSandbox,
  drive9Remote,
  drive9Server,
  installDrive9,
  installFuse,
  killSandbox,
  mountDrive9,
  mountpoint,
  requireDrive9Credential,
  run,
  shellQuote,
  unmountDrive9,
} from './lib'
import type { Sandbox } from '@daytonaio/sdk'

requireDrive9Credential()

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const smokeDir = `${mountpoint}/smoke/${stamp}`
let sandbox: Sandbox | undefined

console.log('=== drive9 + Daytona Smoke Test ===\n')
console.log(`Drive9 server:  ${drive9Server}`)
console.log(`Drive9 remote:  ${drive9Remote}`)

try {
  sandbox = await createSandbox('smoke')
  await installFuse(sandbox, 'smoke')
  await installDrive9(sandbox, 'smoke')
  await mountDrive9(sandbox, 'smoke')

  // Basic write/read round-trip
  await run(
    sandbox,
    'smoke',
    'basic write/read',
    `mkdir -p ${shellQuote(smokeDir)} && ` +
      `printf 'hello from daytona drive9 smoke\\n' > ${shellQuote(`${smokeDir}/probe.txt`)} && ` +
      `cat ${shellQuote(`${smokeDir}/probe.txt`)}`,
  )

  // Verify file is on drive9 server
  await run(
    sandbox,
    'smoke',
    'drive9 fs cat (server-side)',
    `drive9 fs cat ${shellQuote(`${drive9Remote}/smoke/${stamp}/probe.txt`)}`,
  )

  // Git config test (FUSE lockfile semantics)
  await run(
    sandbox,
    'smoke',
    'git config lockfile semantics',
    `mkdir -p ${shellQuote(`${smokeDir}/git-smoke`)} && ` +
      `cd ${shellQuote(`${smokeDir}/git-smoke`)} && ` +
      `git init && ` +
      `git config user.email smoke@example.com && ` +
      `git config user.name smoke && ` +
      `test "$(git config --get user.name)" = "smoke"`,
  )

  // No fatal errors in mount log
  await run(
    sandbox,
    'smoke',
    'log assertions',
    `! grep -Ei 'panic|fatal' /tmp/drive9-mount.log`,
  )

  await unmountDrive9(sandbox, 'smoke')
  console.log('\nSMOKE TEST PASSED')
} finally {
  await killSandbox(sandbox, 'smoke')
}
