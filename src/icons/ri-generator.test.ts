import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '../..')
const script = resolve(root, 'scripts/generate-ri-icons.mjs')

describe('Remix icon generator', () => {
  it('checks generated data and explicit imports independently of cwd', () => {
    const result = spawnSync(process.execPath, [script, '--check'], {
      cwd: tmpdir(),
      encoding: 'utf8',
    })

    expect(result.status, result.stderr || result.stdout).toBe(0)
  })

  it('exposes generate and check package scripts', () => {
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

    expect(pkg.scripts['generate:icons']).toBe('node scripts/generate-ri-icons.mjs')
    expect(pkg.scripts['check:icons']).toBe('node scripts/generate-ri-icons.mjs --check')
  })

  it('keeps the drawer flask icon mapped to the explicit flask data', () => {
    const drawer = readFileSync(resolve(root, 'src/components/header/HeaderDrawer.tsx'), 'utf8')

    expect(drawer).toContain("'icon-flask': riFlaskLine")
  })
})
