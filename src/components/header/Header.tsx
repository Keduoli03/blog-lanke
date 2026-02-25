import { BluredBackground } from './BluredBackground'
import { HeaderContent } from './HeaderContent'
import { SearchButton } from './SearchButton'
import { AnimatedLogo } from './AnimatedLogo'
import { HeaderMeta } from './HeaderMeta'
import { HeaderDrawer } from './HeaderDrawer'
import { useIsMobile } from './hooks'
import { SocialLinks } from './SocialLinks'

export function Header() {
  const isMobile = useIsMobile()

  return (
    <header className="fixed top-0 inset-x-0 h-[64px] z-10 overflow-visible">
      <BluredBackground />
      <div className="max-w-[1100px] h-full md:px-4 mx-auto flex items-center justify-between relative">
        <div className="flex items-center justify-start flex-1 min-w-0">
          {isMobile ? <HeaderDrawer /> : <AnimatedLogo />}
        </div>
        <div className="flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          {isMobile ? <AnimatedLogo /> : <HeaderContent />}
        </div>
        <div className="flex items-center justify-end flex-1 min-w-0 gap-2">
          <SearchButton />
          {!isMobile && <SocialLinks />}
        </div>
        <HeaderMeta />
      </div>
    </header>
  )
}
