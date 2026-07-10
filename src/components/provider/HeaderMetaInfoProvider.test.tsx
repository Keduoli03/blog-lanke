// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import { useAtomValue } from 'jotai'
import { describe, expect, it } from 'vitest'
import { metaDescriptionAtom, metaSlugAtom, metaTitleAtom, pathNameAtom } from '@/store/metaInfo'
import { HeaderMetaInfoProvider } from './HeaderMetaInfoProvider'

function Probe() {
  const path = useAtomValue(pathNameAtom)
  const title = useAtomValue(metaTitleAtom)
  const description = useAtomValue(metaDescriptionAtom)
  const slug = useAtomValue(metaSlugAtom)
  return <output>{[path, title, description, slug].join('|')}</output>
}

describe('HeaderMetaInfoProvider Swup synchronization', () => {
  it('reads route metadata from replaced main content', async () => {
    history.replaceState(null, '', '/archives')
    render(
      <>
        <HeaderMetaInfoProvider pathName="/archives" />
        <Probe />
      </>,
    )

    const main = document.createElement('main')
    main.dataset.headerTitle = 'Article title'
    main.dataset.headerDescription = 'Article description'
    main.dataset.headerSlug = 'article-slug'
    document.body.append(main)
    history.replaceState(null, '', '/posts/article-slug')

    await act(async () => {
      document.dispatchEvent(new Event('swup:content:replace'))
    })

    expect(screen.getByRole('status').textContent).toBe(
      '/posts/article-slug|Article title|Article description|article-slug',
    )
  })
})
