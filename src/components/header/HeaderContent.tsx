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
import {
  riArchiveLine,
  riChat1Line,
  riFilmLine,
  riFlaskLine,
  riGhostLine,
  riHeart2Line,
  riLinksLine,
  riPantoneLine,
} from '@/icons/ri'
import ColumnHover from './ColumnHover'
import AboutHover from './AboutHover'

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
    <div
      className={clsx(
        'transition-opacity duration-300 motion-reduce:transition-none',
        shouldHeaderMetaShow ? 'opacity-0 pointer-events-none' : 'opacity-100',
      )}
      aria-hidden={shouldHeaderMetaShow}
      inert={shouldHeaderMetaShow}
    >
      <HeaderMenu isBgShow={shouldBgShow} />
    </div>
  )
}

function AccessibleMenu() {
  const shouldShow = useShouldAccessibleMenuShow()

  return (
    <RootPortal>
      <AnimatePresence>
        {shouldShow && (
          <motion.div
            className="fixed z-[100] top-[64px] inset-x-0 hidden md:flex justify-center pointer-events-none"
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

function normalizePath(value: string) {
  if (!value) return '/'
  const cleaned = value.replace(/[?#].*$/, '').replace(/\/+$/, '')
  return cleaned === '' ? '/' : cleaned
}

function HeaderMenu({ isBgShow }: { isBgShow: boolean }) {
  const pathName = usePathName()
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [radius, setRadius] = useState(0)

  const currentPath = normalizePath(pathName || '/')
  const isMenuActive = (href: string) => {
    const target = normalizePath(href)
    if (target === '/') return currentPath === '/'
    return currentPath === target || currentPath.startsWith(`${target}/`)
  }

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
            isActive={isMenuActive(menu.link)}
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
  const menuIconMap = {
    'icon-pantone': riPantoneLine,
    'icon-archive': riArchiveLine,
    'icon-flask': riFlaskLine,
    'icon-ghost': riGhostLine,
    'icon-hearts': riHeart2Line,
    'icon-film': riFilmLine,
    'icon-chat': riChat1Line,
  }

  const handleMemosClick =
    href === '/memos'
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
            <Icon icon={menuIconMap[icon as keyof typeof menuIconMap] ?? riLinksLine} />
          </motion.span>
        )}
        <span>{title}</span>
      </div>
      {isActive && (
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"></div>
      )}
    </a>
  )

  if (href === '/columns') return <ColumnHover>{Link}</ColumnHover>
  if (href === '/about') return <AboutHover>{Link}</AboutHover>
  return Link
}
