import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(process.cwd(), 'src/components/BackToTopFAB.tsx'), 'utf8')

describe('BackToTopFAB', () => {
  it('centers the icons in both circular action buttons', () => {
    const buttonClasses = [...source.matchAll(/<motion\.button[\s\S]*?className="([^"]+)"/g)].map(
      ([, className]) => className.split(/\s+/),
    )

    expect(buttonClasses).toHaveLength(2)
    for (const classNames of buttonClasses) {
      expect(classNames).toEqual(expect.arrayContaining(['flex', 'items-center', 'justify-center']))
    }
  })
})
