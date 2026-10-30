export function CrtOverlay({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return null
  }
  return (
    <div className="crt" aria-hidden="true">
      <div className="crt-scan" />
      <div className="crt-grain" />
      <div className="crt-vignette" />
    </div>
  )
}
