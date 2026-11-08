// Zip committed sources (required by addons.mozilla.org for review of bundled code)
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync('source/manifest.json', 'utf8'))
const output = `packages/truckersmp-steam-helper-source-${version}.zip`

mkdirSync('packages', { recursive: true })
execFileSync('git', ['-c', 'safe.directory=*', 'archive', '--format=zip', '-o', output, 'HEAD'], { stdio: 'inherit' })
console.log(`Source archive: ${output} (committed files only)`)
