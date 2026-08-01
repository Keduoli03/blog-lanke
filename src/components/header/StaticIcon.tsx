type StaticIconData = {
  body: string
  width?: number | string
  height?: number | string
}

export function StaticIcon({ icon, className }: { icon: StaticIconData; className?: string }) {
  const width = icon.width ?? 24
  const height = icon.height ?? 24

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  )
}
