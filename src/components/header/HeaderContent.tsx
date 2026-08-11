import { useState } from 'react'
import { menus } from '@/config.json'
import { useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import {
  usePathName,
  useShouldAccessibleMenuShow,
  useShouldHeaderMenuBgShow,
  useShouldHeaderMetaShow,
} from './hooks'
import { RootPortal } from '@/components/RootPortal'
import { StaticIcon } from './StaticIcon'
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

export function HeaderContent({ initialPathName = '/' }: { initialPathName?: string }) {
  return (
    <>
      <AnimatedMenu initialPathName={initialPathName} />
      <AccessibleMenu initialPathName={initialPathName} />
    </>
  )
}

function AnimatedMenu({ initialPathName }: { initialPathName: string }) {
  const shouldBgShow = useShouldHeaderMenuBgShow()
  const shouldHeaderMetaShow = useShouldHeaderMetaShow()

  return (
    <div
      data-header-menu
      className={clsx('', shouldHeaderMetaShow ? 'opacity-0 pointer-events-none' : 'opacity-100')}
      aria-hidden={shouldHeaderMetaShow}
      inert={shouldHeaderMetaShow}
    >
      <HeaderMenu isBgShow={shouldBgShow} initialPathName={initialPathName} />
    </div>
  )
}

function AccessibleMenu({ initialPathName }: { initialPathName: string }) {
  const shouldShow = useShouldAccessibleMenuShow()

  return (
    <RootPortal>
      <AnimatePresence initial={false}>
        {shouldShow && (
          <motion.div
            data-header-accessible-menu
            className="fixed z-[100] top-[64px] inset-x-0 hidden md:flex justify-center pointer-events-none"
            initial={{ y: '-50%', opacity: 0 }}
            animate={{ y: '-50%', opacity: 1 }}
            exit={{ y: '-50%', opacity: 0 }}
          >
            <HeaderMenu isBgShow initialPathName={initialPathName} />
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

function HeaderMenu({ isBgShow, initialPathName }: { isBgShow: boolean; initialPathName: string }) {
  const pathName = usePathName()
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [radius, setRadius] = useState(0)
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => setHasHydrated(true), [])
  const isMenuActive = (href: string) => {
    const target = normalizePath(href)
    const currentPath = normalizePath(hasHydrated ? pathName || initialPathName : initialPathName)
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
      data-header-pill
      className={clsx('relative rounded-full group pointer-events-auto duration-200', {
        'bg-gradient-to-b from-zinc-50/70 to-white/90 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md dark:from-zinc-900/70 dark:to-zinc-800/90 dark:ring-zinc-100/10':
          isBgShow,
      })}
      onMouseMove={handleMouseMove}
    >
      <div
        className="pointer-events-none absolute -z-[1] -inset-px rounded-full opacity-0 duration-500 group-hover:opacity-100"
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

  const hasMounted = useRef(false)

  useEffect(() => {
    hasMounted.current = true
  }, [])

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
      className={clsx(
        'relative block cursor-pointer px-4 py-1.5',
        isActive ? 'text-accent' : 'hover:text-accent',
      )}
      href={href}
      onClick={handleMemosClick}
    >
      <div className="flex items-center space-x-2">
        {isActive && (
          <motion.span
            initial={hasMounted.current ? { y: 8, opacity: 0, scale: 0.92 } : false}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          >
            <StaticIcon
              icon={menuIconMap[icon as keyof typeof menuIconMap] ?? riLinksLine}
              className="size-4 shrink-0"
            />
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
