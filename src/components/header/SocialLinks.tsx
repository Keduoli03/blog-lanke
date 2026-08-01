import { Icon } from '@iconify/react'
import config from '@/config.json'
import { riBallPenLine, riLinkM, riLinksLine, riRocket2Line, riTrainLine } from '@/icons/ri'
import { HoverDropdown } from './HoverDropdown'
import { StaticIcon } from './StaticIcon'

const { socialLinks } = config
const iconMap = {
  'ri:train-line': riTrainLine,
  'ri:ball-pen-line': riBallPenLine,
  'ri:link-m': riLinkM,
}

export function SocialLinks() {
  if (!socialLinks || socialLinks.length === 0) return null

  return (
    <HoverDropdown
      containerClassName="flex items-center justify-center"
      trigger={
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full cursor-pointer hover:bg-secondary/50 transition-colors text-secondary hover:text-primary"
          aria-label="Social Links"
          type="button"
        >
          <StaticIcon icon={riRocket2Line} className="size-5" />
        </button>
      }
      panelClassName="w-36 py-2 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-primary/10 overflow-hidden"
      panel={
        <div className="flex flex-col">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2 hover:bg-secondary/50 transition-colors text-sm text-primary group"
            >
              <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary/30 group-hover:bg-accent/10 group-hover:text-accent transition-colors flex-shrink-0">
                <Icon
                  icon={iconMap[link.icon as keyof typeof iconMap] ?? riLinksLine}
                  className="text-base"
                />
              </div>
              <span className="font-medium truncate">{link.name}</span>
            </a>
          ))}
        </div>
      }
    />
  )
}
