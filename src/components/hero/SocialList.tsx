import clsx from 'clsx'
import { hero } from '@/config.json'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { riAtLine, riGithubLine, riLinksLine, riMailLine, riTwitterXLine } from '@/icons/ri'

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
}

export function SocialList({ className }: { className?: string }) {
  const iconMap = {
    'icon-github': riGithubLine,
    'icon-x': riTwitterXLine,
    'icon-mail': riMailLine,
    'icon-at-line': riAtLine,
    'ri:at-line': riAtLine,
  }
  return (
    <motion.ul
      className={clsx(
        'flex gap-4 flex-wrap items-center justify-center lg:justify-start',
        className,
      )}
      initial="hidden"
      animate="visible"
      transition={{
        staggerChildren: 0.1,
      }}
    >
      {hero.socials.map((social) => (
        <motion.li key={social.name} variants={itemVariants}>
          <a
            className="relative size-9 text-white text-xl flex justify-center items-center group"
            href={social.url}
            title={social.name}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span
              className="absolute inset-0 -z-1 rounded-full group-hover:scale-105 transition"
              style={{ backgroundColor: social.color }}
            ></span>
            <Icon icon={iconMap[social.icon as keyof typeof iconMap] ?? riLinksLine} />
          </a>
        </motion.li>
      ))}
    </motion.ul>
  )
}
