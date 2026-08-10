import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(process.cwd(), 'src/components/BackToTopFAB.tsx'), 'utf8')

describe('BackToTopFAB', () => {
  it('centers the icons in both circular action buttons', () => {
    const buttonClasses = [...source.matchAll(/<button[\s\S]*?className="([^"]+)"/g)].map(
      ([, className]) => className.split(/\s+/),
    )

    expect(buttonClasses).toHaveLength(1)
    expect(buttonClasses[0]).toEqual(
      expect.arrayContaining(['flex', 'items-center', 'justify-center']),
    )
  })
})
