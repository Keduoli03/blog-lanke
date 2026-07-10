import { menus } from '@/config.json'
import { createContext, useContext, useState, forwardRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  riArchiveLine,
  riChat1Line,
  riFilmLine,
  riFlaskLine,
  riGhostLine,
  riHeart2Line,
  riLinksLine,
  riMenuLine,
  riPantoneLine,
} from '@/icons/ri'

const contentVariants: Variants = {
  hidden: {
    x: '100%',
    transition: {
      duration: 0.2,
      ease: [0, 0, 0.2, 1],
    },
  },
  visible: {
    x: 0,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
      duration: 0.2,
      ease: [0, 0, 0.2, 1],
    },
  },
}

const menuItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: '100%',
  },
  visible: {
    opacity: 1,
    x: 0,
  },
}

export function HeaderDrawer({ zIndex = 999 }: { zIndex?: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const overlayZIndex = zIndex - 1
  const contentZIndex = zIndex

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <TriggerButton />
      </Dialog.Trigger>

      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-gray-800/40 data-[state=closed]:pointer-events-none"
                style={{ zIndex: overlayZIndex }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { delay: 0.1 } }}
              ></motion.div>
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                className="fixed right-0 inset-y-0 h-full bg-primary rounded-l-lg p-4 flex flex-col justify-center w-[140px] max-w-[80%] data-[state=closed]:pointer-events-none"
                style={{ zIndex: contentZIndex }}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <DrawerContext.Provider
                  value={{
                    dismiss() {
                      setIsOpen(false)
                    },
                  }}
                >
                  <DrawerContentImpl />
                </DrawerContext.Provider>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

const TriggerButton = forwardRef<HTMLButtonElement>((props, ref) => {
  return (
    <button
      ref={ref}
      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary/50 transition-colors text-secondary hover:text-primary"
      type="button"
      aria-label="Open menu"
      {...props}
    >
      <Icon icon={riMenuLine} className="text-xl" />
    </button>
  )
})

function DrawerContentImpl() {
  const { dismiss } = useContext(DrawerContext)
  const menuIconMap = {
    'icon-pantone': riPantoneLine,
    'icon-archive': riArchiveLine,
    'icon-flask': riFlaskLine,
    'icon-ghost': riGhostLine,
    'icon-hearts': riHeart2Line,
    'icon-film': riFilmLine,
    'icon-chat': riChat1Line,
  }

  return (
    <ul className="mt-8 pb-8 overflow-y-auto overflow-x-hidden min-h-0 flex flex-col">
      {menus.map((menu) => (
        <motion.li key={menu.name} variants={menuItemVariants}>
          <a className="inline-flex items-center p-2 space-x-3" href={menu.link} onClick={dismiss}>
            <Icon
              icon={menuIconMap[menu.icon as keyof typeof menuIconMap] ?? riLinksLine}
              className="text-[1em] leading-none"
            />
            <span>{menu.name}</span>
          </a>
        </motion.li>
      ))}
    </ul>
  )
}

const DrawerContext = createContext<{ dismiss(): void }>(null!)
