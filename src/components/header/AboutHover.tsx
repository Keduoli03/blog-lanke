import AboutQuickMenu from './AboutQuickMenu'
import { HoverDropdown } from './HoverDropdown'

export default function AboutHover({ children }: { children: React.ReactNode }) {
  return (
    <HoverDropdown
      trigger={children}
      panel={<AboutQuickMenu />}
      closeDelay={200}
      panelClassName="min-w-[112px] w-max"
    />
  )
}
