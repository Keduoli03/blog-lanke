import { describe, expect, it } from 'vitest'
import { isPostPublic } from './post-policy'

describe('isPostPublic', () => {
  it('hides drafts in production', () => {
    expect(isPostPublic({ draft: true }, true)).toBe(false)
  })

  it('hides unlisted posts in every environment', () => {
    expect(isPostPublic({ unlisted: true }, false)).toBe(false)
  })

  it('keeps drafts visible in development', () => {
    expect(isPostPublic({ draft: true }, false)).toBe(true)
  })
})
