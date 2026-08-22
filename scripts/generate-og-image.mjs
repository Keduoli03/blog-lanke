import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const root = resolve(import.meta.dirname, '..')
const output = resolve(root, 'public/og-default.png')

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="background" x1="80" y1="20" x2="1120" y2="610" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0B1020"/>
      <stop offset="0.55" stop-color="#172554"/>
      <stop offset="1" stop-color="#312E81"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientTransform="translate(940 120) rotate(132) scale(550 620)" gradientUnits="userSpaceOnUse">
      <stop stop-color="#67E8F9" stop-opacity="0.65"/>
      <stop offset="1" stop-color="#67E8F9" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" rx="42" fill="url(#background)"/>
  <rect width="1200" height="630" rx="42" fill="url(#glow)"/>
  <circle cx="1040" cy="110" r="92" fill="#A5B4FC" fill-opacity="0.18"/>
  <circle cx="1080" cy="520" r="180" fill="#22D3EE" fill-opacity="0.08"/>
  <path d="M80 468C254 390 355 526 512 450C691 363 790 448 1120 318" fill="none" stroke="#A5F3FC" stroke-opacity="0.24" stroke-width="2"/>
  <text x="88" y="210" fill="#A5F3FC" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="7">BLOG.BLUEKE.TOP</text>
  <text x="82" y="330" fill="white" font-family="Arial, sans-serif" font-size="86" font-weight="800">Ditto's Blog</text>
  <text x="88" y="408" fill="#CBD5E1" font-family="Arial, sans-serif" font-size="34">Software · Notes · Life</text>
  <rect x="88" y="490" width="154" height="8" rx="4" fill="#67E8F9"/>
</svg>`

await mkdir(resolve(root, 'public'), { recursive: true })
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(output)
console.log('Generated public/og-default.png (1200x630)')
