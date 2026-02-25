import { useState } from 'react'
import { menus } from '@/config.json'
import { clsx } from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import {
  usePathName,
  useShouldAccessibleMenuShow,
  useShouldHeaderMenuBgShow,
  useShouldHeaderMetaShow,
} from './hooks'
import { RootPortal } from '@/components/RootPortal'
import { Icon } from '@iconify/react'
import '@/icons/registerRi'
import ColumnHover from './ColumnHover'

export function HeaderContent() {
  return (
    <>
      <AnimatedMenu />
      <AccessibleMenu />
    </>
  )
}

function AnimatedMenu() {
  const shouldBgShow = useShouldHeaderMenuBgShow()
  const shouldHeaderMetaShow = useShouldHeaderMetaShow()

  return (
    <AnimatePresence>
      {!shouldHeaderMetaShow && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <HeaderMenu isBgShow={shouldBgShow} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function AccessibleMenu() {
  const shouldShow = useShouldAccessibleMenuShow()

  return (
    <RootPortal>
      <AnimatePresence>
        {shouldShow && (
          <motion.div
            className="fixed z-[100] top-[64px] inset-x-0 flex justify-center pointer-events-none"
            initial={{ y: '-50%', opacity: 0 }}
            animate={{ y: '-50%', opacity: 1 }}
            exit={{ y: '-50%', opacity: 0 }}
          >
            <HeaderMenu isBgShow />
          </motion.div>
        )}
      </AnimatePresence>
    </RootPortal>
  )
}

function HeaderMenu({ isBgShow }: { isBgShow: boolean }) {
  const pathName = usePathName()
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [radius, setRadius] = useState(0)

  const background = `radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, rgb(var(--color-accent) / 0.12) 0%, transparent 65%)`

  const handleMouseMove = ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
    const bounds = currentTarget.getBoundingClientRect()
    setMouseX(clientX - bounds.left)
    setMouseY(clientY - bounds.top)
    setRadius(Math.sqrt(bounds.width ** 2 + bounds.height ** 2) / 2.5)
  }

  return (
    <nav
      className={clsx('relative rounded-full group pointer-events-auto duration-200', {
        'bg-gradient-to-b from-zinc-50/70 to-white/90 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md dark:from-zinc-900/70 dark:to-zinc-800/90 dark:ring-zinc-100/10':
          isBgShow,
      })}
      onMouseMove={handleMouseMove}
    >
      <div
        className="absolute -z-1 -inset-px rounded-full opacity-0 group-hover:opacity-100 duration-500"
        style={{ background }}
        aria-hidden
      ></div>
      <div className="text-sm px-4 flex">
        {menus.map((menu) => (
          <HeaderMenuItem
            key={menu.name}
            href={menu.link}
            title={menu.name}
            icon={menu.icon}
            isActive={pathName === menu.link}
          />
        ))}
      </div>
    </nav>
  )
}

function HeaderMenuItem({
  href,
  isActive,
  title,
  icon,
}: {
  href: string
  isActive: boolean
  title: string
  icon: string
}) {
  const menuIconMap: Record<string, string> = {
    'icon-pantone': 'ri:pantone-line',
    'icon-archive': 'ri:archive-line',
    'icon-flask': 'ri:flask-line',
    'icon-ghost': 'ri:ghost-line',
    'icon-hearts': 'ri:heart-2-line',
    'icon-film': 'ri:film-line',
    'icon-chat': 'ri:chat-1-line',
  }
  const handleMemosClick =
    title === '说说'
      ? () => {
          const once = () => {
            document.removeEventListener('swup:content:replace', once as any)
            if (location.pathname.startsWith('/memos')) {
              ;(window as any).__MEMOS_PAGE_INITED__ = true
              import('@/scripts/memos-runtime.ts').then((m) =>
                m.default ? m.default() : undefined,
              )
            }
          }
          document.addEventListener('swup:content:replace', once as any)
        }
      : undefined
  const Link = (
    <a
      className={clsx('relative block px-4 py-1.5', isActive ? 'text-accent' : 'hover:text-accent')}
      href={href}
      onClick={handleMemosClick}
    >
      <div className="flex items-center space-x-2">
        {isActive && (
          <motion.span initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Icon icon={menuIconMap[icon] ?? 'ri:links-line'} />
          </motion.span>
        )}
        <span>{title}</span>
      </div>
      {isActive && (
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"></div>
      )}
    </a>
  )
  if (title === '专栏') return <ColumnHover>{Link}</ColumnHover>
  return Link
}
