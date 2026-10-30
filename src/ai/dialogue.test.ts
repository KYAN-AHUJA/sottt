import { describe, expect, it } from 'vitest'
import { pickDialogue } from './dialogue'
import { createMatch } from '../engine/gameEngine'
import { SeededRng } from '../engine/rng'

describe('dialogue', () => {
  it('returns contextual lines and respects cooldown', () => {
    const state = createMatch(new SeededRng(1))
    const line = pickDialogue({ ...state, dialogueCooldown: 0, playerHealth: 1 }, 'heal')
    expect(line).toBeTruthy()
    const silent = pickDialogue({ ...state, dialogueCooldown: 2 }, 'heal')
    expect(silent).toBeNull()
  })
})
