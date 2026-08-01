import { useHeaderBgOpacity } from './hooks'

export function BluredBackground() {
  const opacity = useHeaderBgOpacity()

  return (
    <div
      data-header-background
      className="absolute inset-0 -z-1 border-b border-primary bg-white/70 dark:bg-zinc-800/70 backdrop-saturate-150 backdrop-blur-lg transform-gpu motion-reduce:backdrop-blur-none motion-reduce:transform-none"
      style={{
        opacity,
      }}
    ></div>
  )
}
