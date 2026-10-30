import { itemNeedsShell } from './inventory'
import type { GameAction, GameState } from './types'

export function validateAction(state: GameState, action: GameAction): string | null {
  if (state.status !== 'playing') {
    return 'match has ended'
  }
  if (action.actor !== state.currentTurn) {
    return 'not your turn'
  }
  if (state.shells.length === 0 && action.type === 'SHOOT') {
    return 'no shells loaded'
  }

  if (action.type === 'SHOOT') {
    return null
  }

  const charges = state.inventory[action.actor][action.item]
  if (charges <= 0) {
    return 'no remaining uses'
  }
  if (itemNeedsShell(action.item) && state.shells.length === 0) {
    return 'no shell to interact with'
  }
  if (action.item === 'medical_kit') {
    const hp = action.actor === 'player' ? state.playerHealth : state.dealerHealth
    if (hp >= state.maxHealth) {
      return 'already at full health'
    }
  }
  if (action.item === 'handcuffs') {
    const target = action.actor === 'player' ? 'dealer' : 'player'
    if (state.skipTurns[target] > 0) {
      return 'opponent already restrained'
    }
  }
  return null
}
