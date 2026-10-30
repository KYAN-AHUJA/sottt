import { describe, expect, it } from 'vitest'
import { applyDamage, applyHeal, isDead, MAX_HEALTH } from './health'

describe('health', () => {
  it('damages by one and never goes below zero', () => {
    expect(applyDamage(3)).toBe(2)
    expect(applyDamage(1)).toBe(0)
    expect(applyDamage(0)).toBe(0)
  })

  it('heals by one and respects maximum', () => {
    expect(applyHeal(1)).toBe(2)
    expect(applyHeal(3)).toBe(3)
    expect(applyHeal(3, MAX_HEALTH)).toBe(MAX_HEALTH)
  })

  it('treats zero as death', () => {
    expect(isDead(0)).toBe(true)
    expect(isDead(1)).toBe(false)
  })
})
