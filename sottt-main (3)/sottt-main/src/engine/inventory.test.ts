import { describe, expect, it } from 'vitest'
import { applyAction, createMatch } from './gameEngine'
import { SeededRng } from './rng'
import { validateAction } from './validation'
import type { GameState } from './types'

function stateWith(patch: Partial<GameState>): GameState {
  return { ...createMatch(new SeededRng(3)), ...patch }
}

describe('inventory', () => {
  it('magnifying glass reveals only for the actor', () => {
    const start = createMatch(new SeededRng(4))
    const current = start.shells[0]
    const result = applyAction(start, { type: 'USE_ITEM', actor: 'player', item: 'magnifying_glass' })
    expect(result.ok).toBe(true)
    expect(result.state.knownShell.player).toBe(current)
    expect(result.state.knownShell.dealer).toBeNull()
    expect(result.state.inventory.player.magnifying_glass).toBe(0)
  })

  it('handcuffs skip the opponent turn after a shot', () => {
    const start = createMatch(new SeededRng(5))
    const cuffed = applyAction(start, { type: 'USE_ITEM', actor: 'player', item: 'handcuffs' })
    expect(cuffed.state.skipTurns.dealer).toBe(1)
    const shot = applyAction(cuffed.state, { type: 'SHOOT', actor: 'player', target: 'dealer' })
    expect(shot.ok).toBe(true)
    if (shot.state.status === 'playing') {
      expect(shot.state.currentTurn).toBe('player')
      expect(shot.state.skipTurns.dealer).toBe(0)
    }
  })

  it('shell extractor removes the current shell and updates counts', () => {
    const start = createMatch(new SeededRng(6))
    const first = start.shells[0]
    const live = start.liveCount
    const blank = start.blankCount
    const result = applyAction(start, { type: 'USE_ITEM', actor: 'player', item: 'shell_extractor' })
    expect(result.ok).toBe(true)
    if (first === 'LIVE') {
      expect(result.state.liveCount).toBe(live - 1)
    } else {
      expect(result.state.blankCount).toBe(blank - 1)
    }
    expect(result.events.some((e) => e.type === 'extract')).toBe(true)
  })

  it('medical kit heals one and rejects full health', () => {
    const injured = stateWith({ playerHealth: 2 })
    const healed = applyAction(injured, { type: 'USE_ITEM', actor: 'player', item: 'medical_kit' })
    expect(healed.state.playerHealth).toBe(3)
    const denied = validateAction(healed.state, { type: 'USE_ITEM', actor: 'player', item: 'medical_kit' })
    expect(denied).toBe('already at full health')
    expect(applyAction(healed.state, { type: 'USE_ITEM', actor: 'player', item: 'medical_kit' }).ok).toBe(false)
  })

  it('rejects empty charges and double use', () => {
    const start = createMatch(new SeededRng(7))
    const once = applyAction(start, { type: 'USE_ITEM', actor: 'player', item: 'magnifying_glass' })
    const twice = applyAction(once.state, { type: 'USE_ITEM', actor: 'player', item: 'magnifying_glass' })
    expect(twice.ok).toBe(false)
  })
})
