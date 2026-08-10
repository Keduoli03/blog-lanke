import { type ReactNode } from 'react'
import { riChat1Line, riRocket2Line } from '@/icons/ri'
import { StaticIcon } from '@/components/header/StaticIcon'

export function BackToTopFAB() {
  return (
    <div className="fixed right-4 bottom-6 z-10">
      <Buttons />
    </div>
  )
}

function FabButton({
  children,
  label,
  onClick,
  dataAction,
}: {
  children: ReactNode
  label: string
  onClick: () => void
  dataAction: 'comments' | 'rocket'
}) {
  return (
    <button
      data-back-to-top-action={dataAction}
      data-back-to-top-rocket={dataAction === 'rocket' ? '' : undefined}
      className="size-10 flex items-center justify-center rounded-full shadow-lg shadow-zinc-800/5 border border-primary bg-white/50 dark:bg-zinc-800/50 backdrop-blur cursor-pointer transition-[opacity,transform] duration-200 ease-out"
      style={{
        opacity: 1,
        transform: 'scale(1)',
        pointerEvents: 'auto',
      }}
      type="button"
      aria-label={label}
      tabIndex={0}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function Buttons() {
  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }
  const handleScrollToComments = () => {
    const el = document.getElementById('comments')
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 72
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-3 items-end">
      <FabButton label="Go to comments" onClick={handleScrollToComments} dataAction="comments">
        <StaticIcon icon={riChat1Line} className="size-5" />
      </FabButton>
      <FabButton label="Back to top" onClick={handleBackToTop} dataAction="rocket">
        <StaticIcon icon={riRocket2Line} className="size-5" />
      </FabButton>
    </div>
  )
}
