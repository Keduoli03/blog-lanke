import { site } from '@/config.json'
import { AnimatePresence, motion } from 'framer-motion'
import { useHeaderMetaInfo, useShouldHeaderMetaShow } from './hooks'

export function HeaderMeta() {
  const { title, description, slug } = useHeaderMetaInfo()
  const shouldShow = useShouldHeaderMetaShow()

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-between px-4 pointer-events-none md:px-4"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: 20,
          }}
        >
          <div className="grow min-w-0 pl-0 pr-24 md:pl-20 md:pr-0 pointer-events-auto">
            <div className="text-secondary text-xs truncate">{description}</div>
            <h2 className="truncate text-lg">{title}</h2>
          </div>
          <div className="hidden md:block min-w-0 text-right pr-20 md:pr-28 pointer-events-auto max-w-[50%]">
            <div className="text-secondary text-xs truncate">{slug}</div>
            <div>{site.title}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
