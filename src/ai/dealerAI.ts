import { calculateProbabilities } from '../engine/probability'
import { opponentOf } from '../engine/inventory'
import type { DealerMode, GameAction, GameState, ShellType } from '../engine/types'

export function selectDealerMode(state: GameState): DealerMode {
  const p = publicP(state)
  const recklessPlayer =
    state.memory.selfShots >= 2 && state.memory.selfShots > state.memory.opponentShots
  if (recklessPlayer || (state.playerHealth === 1 && state.dealerHealth > 1)) {
    return 'MANIPULATIVE'
  }
  if (p.live >= 0.6 || state.dealerHealth < state.playerHealth) {
    return 'AGGRESSIVE'
  }
  return 'CALCULATED'
}

function publicP(state: GameState) {
  return calculateProbabilities({
    shells: state.shells,
    liveCount: state.liveCount,
    blankCount: state.blankCount,
  })
}

function certainShell(state: GameState): ShellType | null {
  if (state.knownShell.dealer) {
    return state.knownShell.dealer
  }
  if (state.liveCount > 0 && state.blankCount === 0) {
    return 'LIVE'
  }
  if (state.blankCount > 0 && state.liveCount === 0) {
    return 'BLANK'
  }
  return state.inferredShell
}

export function chooseDealerAction(state: GameState): GameAction {
  if (state.status !== 'playing' || state.currentTurn !== 'dealer') {
    throw new Error('dealer cannot act')
  }
  const mode = selectDealerMode(state)
  const p = publicP(state)
  const known = certainShell(state)
  const inv = state.inventory.dealer
  const canItem = state.dealerActionsThisTurn < 2

  if (canItem && inv.medical_kit > 0 && state.dealerHealth < state.maxHealth) {
    if (state.dealerHealth === 1 || (mode === 'CALCULATED' && state.dealerHealth === 2 && p.live >= 0.5)) {
      return { type: 'USE_ITEM', actor: 'dealer', item: 'medical_kit' }
    }
  }

  if (canItem && inv.magnifying_glass > 0 && !known && state.shells.length >= 2) {
    const uncertain = p.live >= 0.4 && p.live <= 0.7
    if (mode !== 'AGGRESSIVE' || state.dealerHealth === 1 || uncertain) {
      return { type: 'USE_ITEM', actor: 'dealer', item: 'magnifying_glass' }
    }
  }

  if (known === 'LIVE') {
    if (canItem && inv.handcuffs > 0 && state.skipTurns.player === 0 && state.dealerHealth <= 2) {
      return { type: 'USE_ITEM', actor: 'dealer', item: 'handcuffs' }
    }
    return { type: 'SHOOT', actor: 'dealer', target: 'player' }
  }

  if (known === 'BLANK') {
    return { type: 'SHOOT', actor: 'dealer', target: 'dealer' }
  }

  if (canItem && inv.handcuffs > 0 && state.skipTurns.player === 0 && p.live >= 0.66) {
    return { type: 'USE_ITEM', actor: 'dealer', item: 'handcuffs' }
  }

  if (
    canItem &&
    inv.shell_extractor > 0 &&
    state.shells.length >= 3 &&
    mode === 'CALCULATED' &&
    p.live <= 0.34 &&
    state.dealerHealth === 1
  ) {
    return { type: 'USE_ITEM', actor: 'dealer', item: 'shell_extractor' }
  }

  if (mode === 'AGGRESSIVE') {
    if (p.live >= 0.5) {
      return { type: 'SHOOT', actor: 'dealer', target: 'player' }
    }
    return { type: 'SHOOT', actor: 'dealer', target: 'dealer' }
  }

  if (mode === 'MANIPULATIVE') {
    if (state.memory.selfShots > state.memory.opponentShots && p.live >= 0.4) {
      return { type: 'SHOOT', actor: 'dealer', target: 'player' }
    }
    if (p.blank >= 0.5) {
      return { type: 'SHOOT', actor: 'dealer', target: 'dealer' }
    }
  }

  if (p.live > 0.5) {
    return { type: 'SHOOT', actor: 'dealer', target: 'player' }
  }
  if (p.blank > 0.5) {
    return { type: 'SHOOT', actor: 'dealer', target: 'dealer' }
  }
  if (state.dealerHealth > state.playerHealth) {
    return { type: 'SHOOT', actor: 'dealer', target: 'player' }
  }
  return { type: 'SHOOT', actor: 'dealer', target: opponentOf('dealer') }
}
