import { describe, expect, it } from 'vitest'
import { chooseDealerAction, selectDealerMode } from './dealerAI'
import { createMatch } from '../engine/gameEngine'
import { SeededRng } from '../engine/rng'
import type { GameState } from '../engine/types'

function dealerState(patch: Partial<GameState>): GameState {
  const base = createMatch(new SeededRng(11))
  return {
    ...base,
    currentTurn: 'dealer',
    ...patch,
    inventory: {
      player: { ...base.inventory.player, ...(patch.inventory?.player ?? {}) },
      dealer: { ...base.inventory.dealer, ...(patch.inventory?.dealer ?? {}) },
    },
  }
}

describe('dealer AI', () => {
  it('uses public probabilities and known shells only', () => {
    const a = dealerState({
      shells: ['LIVE', 'BLANK', 'BLANK'],
      liveCount: 1,
      blankCount: 2,
      knownShell: { player: null, dealer: null },
      inventory: {
        player: createMatch(new SeededRng(1)).inventory.player,
        dealer: {
          magnifying_glass: 0,
          handcuffs: 0,
          shell_extractor: 0,
          medical_kit: 0,
        },
      },
    })
    const b = {
      ...a,
      shells: ['BLANK', 'BLANK', 'LIVE'] as GameState['shells'],
    }
    expect(chooseDealerAction(a)).toEqual(chooseDealerAction(b))
  })

  it('shoots the player when the current shell is known live', () => {
    const state = dealerState({
      knownShell: { player: null, dealer: 'LIVE' },
      liveCount: 1,
      blankCount: 1,
      shells: ['LIVE', 'BLANK'],
      inventory: {
        player: createMatch(new SeededRng(2)).inventory.player,
        dealer: {
          magnifying_glass: 0,
          handcuffs: 0,
          shell_extractor: 0,
          medical_kit: 0,
        },
      },
    })
    expect(chooseDealerAction(state)).toEqual({ type: 'SHOOT', actor: 'dealer', target: 'player' })
  })

  it('shoots self when the current shell is known blank', () => {
    const state = dealerState({
      knownShell: { player: null, dealer: 'BLANK' },
      shells: ['BLANK', 'LIVE'],
      liveCount: 1,
      blankCount: 1,
      inventory: {
        player: createMatch(new SeededRng(2)).inventory.player,
        dealer: {
          magnifying_glass: 0,
          handcuffs: 0,
          shell_extractor: 0,
          medical_kit: 0,
        },
      },
    })
    expect(chooseDealerAction(state)).toEqual({ type: 'SHOOT', actor: 'dealer', target: 'dealer' })
  })

  it('switches modes with health and player behaviour', () => {
    const aggressive = dealerState({ dealerHealth: 1, playerHealth: 3, liveCount: 3, blankCount: 1, shells: ['LIVE', 'LIVE', 'LIVE', 'BLANK'] })
    expect(selectDealerMode(aggressive)).toBe('AGGRESSIVE')
    const manip = dealerState({
      playerHealth: 1,
      dealerHealth: 3,
      memory: {
        opponentShots: 0,
        selfShots: 4,
        itemUses: 0,
        recent: ['shoot_self', 'shoot_self'],
        inspectedThenShotOpponent: 0,
        inspectedThenShotSelf: 0,
      },
    })
    expect(selectDealerMode(manip)).toBe('MANIPULATIVE')
  })

  it('heals when critically wounded', () => {
    const state = dealerState({
      dealerHealth: 1,
      knownShell: { player: null, dealer: null },
    })
    expect(chooseDealerAction(state)).toEqual({
      type: 'USE_ITEM',
      actor: 'dealer',
      item: 'medical_kit',
    })
  })
})
