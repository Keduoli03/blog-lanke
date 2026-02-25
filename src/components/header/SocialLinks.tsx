import { Icon } from '@iconify/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import config from '@/config.json'

const { socialLinks } = config

export function SocialLinks() {
  const [isOpen, setIsOpen] = useState(false)

  if (!socialLinks || socialLinks.length === 0) return null

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary/50 transition-colors text-secondary hover:text-primary"
        aria-label="Social Links"
      >
        <Icon icon="ri:rocket-2-line" className="text-xl" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 10, scale: 0.95, x: '-50%' }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-1/2 mt-2 w-36 py-2 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-primary/10 overflow-hidden z-50 origin-top"
          >
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
                    <Icon icon={link.icon} className="text-base" />
                  </div>
                  <span className="font-medium truncate">{link.name}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
