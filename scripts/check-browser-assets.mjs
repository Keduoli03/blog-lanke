import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

const distDir = new URL('../dist/', import.meta.url)
const astroAssetsDir = new URL('_astro/', distDir)
const html = readFileSync(new URL('index.html', distDir), 'utf8')
const assets = readdirSync(astroAssetsDir)
  .filter((file) => file.endsWith('.js'))
  .map((file) => readFileSync(new URL(file, astroAssetsDir), 'utf8'))

assert.doesNotMatch(html, /\/_astro\/(?:lightbox|livecodes)\.[^"' ]+\.ts/)
assert.ok(assets.some((code) => code.includes('md-lightbox-dialog')))
assert.ok(assets.some((code) => code.includes('.livecodes-runner') && code.includes('import(')))

console.log('Browser assets: compiled JavaScript verified.')
