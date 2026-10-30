import type { Chamber } from './shells'
import type { Probabilities } from './types'

export function calculateProbabilities(chamber: Chamber): Probabilities {
  const total = chamber.shells.length
  if (total <= 0) {
    return {
      live: 0,
      blank: 0,
      total: 0,
      remainingLive: 0,
      remainingBlank: 0,
    }
  }
  return {
    live: chamber.liveCount / total,
    blank: chamber.blankCount / total,
    total,
    remainingLive: chamber.liveCount,
    remainingBlank: chamber.blankCount,
  }
}

export function probabilitiesFromCounts(
  liveCount: number,
  blankCount: number,
): Probabilities {
  return calculateProbabilities({
    shells: [
      ...Array<'LIVE'>(liveCount).fill('LIVE'),
      ...Array<'BLANK'>(blankCount).fill('BLANK'),
    ],
    liveCount,
    blankCount,
  })
}
