import { useAtomValue } from 'jotai'
import { useEffect, useState, type ReactNode } from 'react'
import { pageScrollLocationAtom } from '@/store/scrollInfo'
import { riChat1Line, riRocket2Line } from '@/icons/ri'
import { StaticIcon } from '@/components/header/StaticIcon'

export function BackToTopFAB() {
  const scrollY = useAtomValue(pageScrollLocationAtom)
  const isShow = scrollY > 100
  const [hasComments, setHasComments] = useState(false)

  useEffect(() => {
    const check = () => setHasComments(!!document.getElementById('comments'))
    check()
    const handler = () => setTimeout(check, 0)
    document.addEventListener('swup:content:replace', handler)
    return () => document.removeEventListener('swup:content:replace', handler)
  }, [])

  return (
    <div className="fixed right-4 bottom-6 z-10">
      <Buttons hasComments={hasComments} isVisible={isShow} />
    </div>
  )
}

function FabButton({
  children,
  label,
  onClick,
  isVisible,
  dataAttribute,
}: {
  children: ReactNode
  label: string
  onClick: () => void
  isVisible: boolean
  dataAttribute?: string
}) {
  return (
    <button
      data-back-to-top-rocket={dataAttribute}
      className="size-10 flex items-center justify-center rounded-full shadow-lg shadow-zinc-800/5 border border-primary bg-white/50 dark:bg-zinc-800/50 backdrop-blur cursor-pointer transition-[opacity,transform] duration-200 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.8)',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
      type="button"
      aria-label={label}
      tabIndex={isVisible ? 0 : -1}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function Buttons({ hasComments, isVisible }: { hasComments: boolean; isVisible: boolean }) {
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
      {hasComments && (
        <FabButton label="Go to comments" onClick={handleScrollToComments} isVisible={isVisible}>
          <StaticIcon icon={riChat1Line} className="size-5" />
        </FabButton>
      )}
      <FabButton
        label="Back to top"
        onClick={handleBackToTop}
        isVisible={isVisible}
        dataAttribute=""
      >
        <StaticIcon icon={riRocket2Line} className="size-5" />
      </FabButton>
    </div>
  )
}
