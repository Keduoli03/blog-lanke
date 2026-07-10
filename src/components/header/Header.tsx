import { BluredBackground } from './BluredBackground'
import { HeaderContent } from './HeaderContent'
import { SearchButton } from './SearchButton'
import { AnimatedLogo } from './AnimatedLogo'
import { HeaderMeta } from './HeaderMeta'
import { HeaderDrawer } from './HeaderDrawer'
import { SocialLinks } from './SocialLinks'
import { HeadGradient } from '@/components/head-gradient'

export function Header() {
  return (
    <header className="fixed top-0 inset-x-0 h-[64px] z-10 overflow-visible">
      <BluredBackground />
      <HeadGradient />
      <div className="max-w-[1100px] h-full px-4 mx-auto flex items-center justify-between relative">
        <div className="flex items-center justify-start flex-1 min-w-0">
          <AnimatedLogo />
        </div>
        <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <HeaderContent />
        </div>
        <div className="flex items-center justify-end flex-1 min-w-0 gap-2 z-20">
          <SearchButton />
          <div className="md:hidden">
            <HeaderDrawer />
          </div>
          <div className="hidden md:flex">
            <SocialLinks />
          </div>
        </div>
        <HeaderMeta />
      </div>
    </header>
  )
}
