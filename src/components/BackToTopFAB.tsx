import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { pageScrollLocationAtom } from '@/store/scrollInfo'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import '@/icons/registerRi'

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
      <AnimatePresence>{isShow && <Buttons hasComments={hasComments} />}</AnimatePresence>
    </div>
  )
}

function Buttons({ hasComments }: { hasComments: boolean }) {
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
        <motion.button
          className="size-10 rounded-full shadow-lg shadow-zinc-800/5 border border-primary bg-white/50 dark:bg-zinc-800/50 backdrop-blur"
          type="button"
          aria-label="Go to comments"
          onClick={handleScrollToComments}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
        >
          <Icon icon="ri:chat-1-line" />
        </motion.button>
      )}
      <motion.button
        className="size-10 rounded-full shadow-lg shadow-zinc-800/5 border border-primary bg-white/50 dark:bg-zinc-800/50 backdrop-blur"
        type="button"
        aria-label="Back to top"
        onClick={handleBackToTop}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
      >
        <Icon icon="ri:rocket-2-line" />
      </motion.button>
    </div>
  )
}
