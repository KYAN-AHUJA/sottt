import type { GameState } from '../engine/types'

const LINES: Record<string, string[]> = {
  live_shot: [
    'Live. Predictable thunder.',
    'That was unnecessary.',
    'Do you actually have a strategy?',
    "You're becoming a rather irritating guest.",
    'Enjoy the ringing. It fades. The hole does not.',
  ],
  blank_shot: [
    'Empty. How inconvenient.',
    'A courtesy from the chamber.',
    'Starting to understand the odds?',
    'You flinch at ghosts.',
    'Silence can be worse.',
  ],
  inspect: [
    'Peeking. How intimate.',
    'Knowledge is a brittle comfort.',
    'Resourceful. Almost impressive.',
    'See something you like?',
  ],
  cuffs: [
    'How inconvenient.',
    "Restrain me. I'll remember the shape of it.",
    'A delay. Not a pardon.',
    'You bought a breath. Spend it.',
  ],
  extract: [
    'Ejecting fate. Cute.',
    'The chamber forgets nothing.',
    'Throwing away a secret.',
  ],
  heal: [
    "Enjoy that little miracle. It won't last.",
    'Patch the meat. The fear stays.',
    'One more turn in the dark.',
  ],
  pressure: [
    'Your hands are louder than your thoughts.',
    'You keep choosing the same door.',
    'I can hear you counting.',
    'Sit up. This is the interesting part.',
  ],
  low_player: [
    'One more and you belong to the floor.',
    "You're leaking. How unprofessional.",
    'The table wants your weight.',
  ],
  low_dealer: [
    "I'm still smiling. Notice that.",
    'Closer. Good.',
    'You almost look hopeful.',
  ],
}

export function pickDialogue(state: GameState, trigger: string): string | null {
  if (state.dialogueCooldown > 0) {
    return null
  }
  const pool = [...(LINES[trigger] ?? [])]
  if (state.playerHealth === 1) {
    pool.push(...LINES.low_player)
  }
  if (state.dealerHealth === 1) {
    pool.push(...LINES.low_dealer)
  }
  if (state.memory.selfShots > state.memory.opponentShots + 1) {
    pool.push(...LINES.pressure)
  }
  if (pool.length === 0) {
    return null
  }
  const index = state.turnIndex % pool.length
  const line = pool[index]
  if (line === state.lastDialogue) {
    return pool[(index + 1) % pool.length] ?? null
  }
  return line
}
