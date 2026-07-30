import { Icon } from '@iconify/react'
import { riComputerLine } from '@/icons/ri'

export default function AboutQuickMenu() {
  return (
    <div className="w-full rounded-lg bg-gradient-to-b from-zinc-50/80 to-white/90 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md dark:from-zinc-900/80 dark:to-zinc-800/90 dark:ring-zinc-100/10">
      <ul className="p-1 text-sm">
        <li>
          <a
            className="group/svc flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-md hover:bg-secondary/60"
            href="/services"
          >
            <Icon
              className="shrink-0 text-secondary transition-colors duration-200 group-hover/svc:text-accent"
              icon={riComputerLine}
            />
            <span className="transition-colors duration-200 group-hover/svc:text-accent">服务</span>
          </a>
        </li>
      </ul>
    </div>
  )
}
