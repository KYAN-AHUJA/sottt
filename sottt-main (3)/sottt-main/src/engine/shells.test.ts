import { describe, expect, it } from 'vitest'
import { SeededRng } from './rng'
import { calculateProbabilities } from './probability'
import { assertChamber, consumeShell, generateChamber, peekShell } from './shells'

describe('shell system', () => {
  it('generates mixed live and blank sequences', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const chamber = generateChamber(new SeededRng(seed))
      assertChamber(chamber)
      expect(chamber.shells.length).toBeGreaterThanOrEqual(3)
      expect(chamber.shells.length).toBeLessThanOrEqual(5)
      expect(chamber.liveCount).toBeGreaterThan(0)
      expect(chamber.blankCount).toBeGreaterThan(0)
      expect(chamber.liveCount + chamber.blankCount).toBe(chamber.shells.length)
    }
  })

  it('keeps counts aligned after removal', () => {
    let chamber = generateChamber(new SeededRng(9))
    const start = chamber.shells.length
    const first = peekShell(chamber)
    const consumed = consumeShell(chamber)
    chamber = consumed.chamber
    expect(consumed.shell).toBe(first)
    expect(chamber.shells.length).toBe(start - 1)
    expect(chamber.liveCount + chamber.blankCount).toBe(chamber.shells.length)
    assertChamber(chamber)
  })

  it('calculates probabilities from remaining counts', () => {
    const p = calculateProbabilities({
      shells: ['LIVE', 'BLANK', 'BLANK'],
      liveCount: 1,
      blankCount: 2,
    })
    expect(p.live).toBeCloseTo(1 / 3)
    expect(p.blank).toBeCloseTo(2 / 3)
    expect(p.total).toBe(3)
  })

  it('recalculates after each removal', () => {
    let chamber = {
      shells: ['LIVE', 'BLANK'] as const,
      liveCount: 1,
      blankCount: 1,
    }
    const after = consumeShell({ ...chamber, shells: [...chamber.shells] }).chamber
    const p = calculateProbabilities(after)
    expect(p.total).toBe(1)
    expect(p.live + p.blank).toBeCloseTo(1)
  })
})
