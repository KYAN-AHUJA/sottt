export interface Rng {
  next(): number
  int(min: number, maxInclusive: number): number
  shuffle<T>(items: T[]): T[]
}

export class SeededRng implements Rng {
  private s: number

  constructor(seed: number) {
    this.s = seed >>> 0
  }

  next(): number {
    this.s += 0x6d2b79f5
    let t = this.s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  int(min: number, maxInclusive: number): number {
    if (maxInclusive < min) {
      throw new Error('invalid rng range')
    }
    return min + Math.floor(this.next() * (maxInclusive - min + 1))
  }

  shuffle<T>(items: T[]): T[] {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i)
      const tmp = copy[i]
      copy[i] = copy[j]
      copy[j] = tmp
    }
    return copy
  }
}

export class SystemRng implements Rng {
  next(): number {
    return Math.random()
  }

  int(min: number, maxInclusive: number): number {
    if (maxInclusive < min) {
      throw new Error('invalid rng range')
    }
    return min + Math.floor(Math.random() * (maxInclusive - min + 1))
  }

  shuffle<T>(items: T[]): T[] {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i)
      const tmp = copy[i]
      copy[i] = copy[j]
      copy[j] = tmp
    }
    return copy
  }
}
