export const MAX_HEALTH = 3
export const START_HEALTH = 3

export function clampHealth(value: number, max = MAX_HEALTH): number {
  return Math.max(0, Math.min(max, value))
}

export function applyDamage(health: number): number {
  return clampHealth(health - 1)
}

export function applyHeal(health: number, max = MAX_HEALTH): number {
  if (health >= max) {
    return health
  }
  return clampHealth(health + 1, max)
}

export function isDead(health: number): boolean {
  return health <= 0
}
