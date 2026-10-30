import type { Actor, GameState, ItemId } from './types'
import { ITEM_IDS } from './types'

export const STARTING_CHARGES: Record<ItemId, number> = {
  magnifying_glass: 1,
  handcuffs: 1,
  shell_extractor: 1,
  medical_kit: 1,
}

export function emptyInventory(): Record<ItemId, number> {
  return {
    magnifying_glass: 0,
    handcuffs: 0,
    shell_extractor: 0,
    medical_kit: 0,
  }
}

export function startingInventory(): Record<ItemId, number> {
  return { ...STARTING_CHARGES }
}

export function opponentOf(actor: Actor): Actor {
  return actor === 'player' ? 'dealer' : 'player'
}

export function hasCharge(state: GameState, actor: Actor, item: ItemId): boolean {
  return state.inventory[actor][item] > 0
}

export function itemNeedsShell(item: ItemId): boolean {
  return item === 'magnifying_glass' || item === 'shell_extractor'
}

export function cloneInventory(inv: Record<ItemId, number>): Record<ItemId, number> {
  const next = emptyInventory()
  for (const id of ITEM_IDS) {
    next[id] = inv[id]
  }
  return next
}
