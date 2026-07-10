import { useShouldHeaderMetaShow, useIsMobile } from './hooks'
import { author } from '@/config.json'
import clsx from 'clsx'

export function AnimatedLogo() {
  const isMobile = useIsMobile()
  const shouldHeaderMetaShow = useShouldHeaderMetaShow()

  const hidden = isMobile && shouldHeaderMetaShow

  return (
    <div
      className={clsx(
        'transition-opacity duration-300 motion-reduce:transition-none',
        hidden ? 'opacity-0 pointer-events-none' : 'opacity-100',
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
    <a className="block" href="/" title="Nav to home">
      <img
        className="size-[40px] select-none object-cover rounded-2xl"
        src={author.avatar}
        alt="Site owner avatar"
      />
    </a>
  )
}
