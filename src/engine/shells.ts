import type { Rng } from './rng'
import type { ShellType } from './types'

export interface Chamber {
  shells: ShellType[]
  liveCount: number
  blankCount: number
}

export function generateChamber(rng: Rng): Chamber {
  const total = rng.int(3, 5)
  const liveCount = rng.int(1, total - 1)
  const blankCount = total - liveCount
  const shells: ShellType[] = [
    ...Array<ShellType>(liveCount).fill('LIVE'),
    ...Array<ShellType>(blankCount).fill('BLANK'),
  ]
  const shuffled = rng.shuffle(shells)
  return { shells: shuffled, liveCount, blankCount }
}

export function assertChamber(chamber: Chamber): void {
  if (chamber.liveCount < 0 || chamber.blankCount < 0) {
    throw new Error('shell counts cannot be negative')
  }
  if (chamber.shells.length !== chamber.liveCount + chamber.blankCount) {
    throw new Error('shell sequence does not match counts')
  }
  const live = chamber.shells.filter((s) => s === 'LIVE').length
  const blank = chamber.shells.filter((s) => s === 'BLANK').length
  if (live !== chamber.liveCount || blank !== chamber.blankCount) {
    throw new Error('shell types do not match counts')
  }
}

export function consumeShell(chamber: Chamber): { chamber: Chamber; shell: ShellType } {
  assertChamber(chamber)
  const shell = chamber.shells[0]
  if (!shell) {
    throw new Error('cannot consume from empty chamber')
  }
  const next: Chamber = {
    shells: chamber.shells.slice(1),
    liveCount: chamber.liveCount - (shell === 'LIVE' ? 1 : 0),
    blankCount: chamber.blankCount - (shell === 'BLANK' ? 1 : 0),
  }
  assertChamber(next)
  return { chamber: next, shell }
}

export function peekShell(chamber: Chamber): ShellType {
  const shell = chamber.shells[0]
  if (!shell) {
    throw new Error('cannot inspect empty chamber')
  }
  return shell
}

export function isEmpty(chamber: Chamber): boolean {
  return chamber.shells.length === 0
}
