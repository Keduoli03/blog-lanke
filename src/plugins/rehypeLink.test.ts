import { describe, expect, it } from 'vitest'
import { rehypeLink } from './rehypeLink.js'

describe('rehypeLink', () => {
  it('ignores links without an href', () => {
    const tree = {
      type: 'root',
      children: [{ type: 'element', tagName: 'a', properties: {}, children: [] }],
    }

    expect(() => rehypeLink()(tree)).not.toThrow()
  })
})
