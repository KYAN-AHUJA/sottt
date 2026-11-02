import type { ItemId } from '../engine/types'

export function ItemIcon({ id }: { id: ItemId }) {
  if (id === 'magnifying_glass') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="6" cy="6" r="4" fill="none" stroke="#c9b8a0" strokeWidth="1.5" />
        <path d="M9 9 L14 14" stroke="#8a3a3a" strokeWidth="2" />
      </svg>
    )
  }
  if (id === 'handcuffs') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="4.5" cy="8" r="3" fill="none" stroke="#c9b8a0" strokeWidth="1.5" />
        <circle cx="11.5" cy="8" r="3" fill="none" stroke="#c9b8a0" strokeWidth="1.5" />
        <path d="M7.5 8 H8.5" stroke="#8a3a3a" strokeWidth="1.5" />
      </svg>
    )
  }
  if (id === 'shell_extractor') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <rect x="3" y="6" width="10" height="4" rx="1" fill="#5c5854" stroke="#c9b8a0" />
        <rect x="11" y="5" width="3" height="6" fill="#8a3a3a" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3" y="5" width="10" height="7" fill="#3a1a1a" stroke="#c9b8a0" />
      <path d="M3 5 L8 2 L13 5" fill="#6b2a2a" stroke="#c9b8a0" />
      <rect x="7" y="8" width="2" height="3" fill="#c9b8a0" />
    </svg>
  )
}
