import { useShouldHeaderMetaShow, useIsMobile } from './hooks'
import { author } from '@/config.json'
import clsx from 'clsx'

export function AnimatedLogo() {
  const isMobile = useIsMobile()
  const shouldHeaderMetaShow = useShouldHeaderMetaShow()
  const hidden = isMobile && shouldHeaderMetaShow

  return (
    <div
      data-header-logo
      className={clsx(
        'relative z-[200] pointer-events-auto',
        shouldHeaderMetaShow ? 'max-md:opacity-0 max-md:pointer-events-none' : 'opacity-100',
      )}
      aria-hidden={hidden}
      inert={hidden}
    >
      <Logo />
    </div>
  )
}

function Logo() {
  return (
    <a className="relative z-[201] block pointer-events-auto" href="/" title="Nav to home">
      <img
        className="size-[40px] select-none object-cover rounded-2xl"
        src={author.avatar}
        alt="Site owner avatar"
      />
    </a>
  )
}
