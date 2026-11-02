import { describe, expect, it } from 'vitest'
import { applyAction, createMatch, GameEngine } from './gameEngine'
import { SeededRng } from './rng'

describe('game progression', () => {
  it('starts a match with three health each', () => {
    const state = createMatch(new SeededRng(1))
    expect(state.playerHealth).toBe(3)
    expect(state.dealerHealth).toBe(3)
    expect(state.currentTurn).toBe('player')
    expect(state.status).toBe('playing')
    expect(state.shells.length).toBeGreaterThan(0)
  })

  it('alternates turns after shooting the opponent with a live or after a blank on the opponent', () => {
    const engine = new GameEngine(new SeededRng(12))
    const before = engine.getState()
    const result = engine.apply({ type: 'SHOOT', actor: 'player', target: 'dealer' })
    expect(result.ok).toBe(true)
    if (result.state.status === 'playing') {
      const extra = result.events.some((e) => e.type === 'extra_turn')
      if (extra) {
        expect(result.state.currentTurn).toBe('player')
      } else {
        expect(result.state.currentTurn).toBe('dealer')
      }
    }
    expect(before.shells.length).toBeGreaterThan(result.state.shells.length - 5)
  })

  it('ends in defeat when player health hits zero', () => {
    let state = createMatch(new SeededRng(8))
    state = {
      ...state,
      playerHealth: 1,
      currentTurn: 'dealer',
      shells: ['LIVE'],
      liveCount: 1,
      blankCount: 0,
      inventory: state.inventory,
    }
    const result = applyAction(state, { type: 'SHOOT', actor: 'dealer', target: 'player' })
    expect(result.state.playerHealth).toBe(0)
    expect(result.state.status).toBe('defeat')
    expect(result.events.some((e) => e.type === 'defeat')).toBe(true)
    expect(applyAction(result.state, { type: 'SHOOT', actor: 'dealer', target: 'player' }).ok).toBe(false)
  })

  it('ends in victory when dealer health hits zero', () => {
    let state = createMatch(new SeededRng(8))
    state = {
      ...state,
      dealerHealth: 1,
      shells: ['LIVE'],
      liveCount: 1,
      blankCount: 0,
    }
    const result = applyAction(state, { type: 'SHOOT', actor: 'player', target: 'dealer' })
    expect(result.state.status).toBe('victory')
  })

  it('restart replaces match state', () => {
    const engine = new GameEngine(new SeededRng(21))
    engine.apply({ type: 'SHOOT', actor: 'player', target: 'dealer' })
    const restarted = engine.startMatch()
    expect(restarted.playerHealth).toBe(3)
    expect(restarted.dealerHealth).toBe(3)
    expect(restarted.round).toBe(1)
    expect(restarted.status).toBe('playing')
  })

  it('reloads a new sequence when the chamber empties without a death', () => {
    const state = createMatch(new SeededRng(2))
    const prepared = {
      ...state,
      shells: ['BLANK'] as const,
      liveCount: 0,
      blankCount: 1,
      playerHealth: 3,
      dealerHealth: 3,
    }
    const result = applyAction(prepared, { type: 'SHOOT', actor: 'player', target: 'dealer' }, new SeededRng(99))
    expect(result.state.status).toBe('playing')
    expect(result.state.shells.length).toBeGreaterThan(0)
    expect(result.events.some((e) => e.type === 'reload')).toBe(true)
  })
})
