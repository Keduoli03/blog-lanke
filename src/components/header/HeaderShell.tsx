import type { PropsWithChildren } from 'react'
import { MotionConfig } from 'framer-motion'
import { Provider } from '@/components/provider/Provider'
import { Header } from './Header'

type HeaderShellProps = {
  pathName: string
  title?: string
  description?: string
  slug?: string
}

export function HeaderMotionConfig({ children }: PropsWithChildren) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}

export function HeaderShell(props: HeaderShellProps) {
  return (
    <HeaderMotionConfig>
      <Provider {...props} />
      <Header {...props} />
    </HeaderMotionConfig>
  )
}
