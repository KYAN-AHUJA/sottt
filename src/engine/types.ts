export type ShellType = 'LIVE' | 'BLANK'
export type Actor = 'player' | 'dealer'
export type ItemId =
  | 'magnifying_glass'
  | 'handcuffs'
  | 'shell_extractor'
  | 'medical_kit'
export type DealerMode = 'CALCULATED' | 'AGGRESSIVE' | 'MANIPULATIVE'
export type MatchStatus = 'playing' | 'victory' | 'defeat'
export type Screen = 'menu' | 'howToPlay' | 'settings' | 'credits' | 'game'

export const ITEM_IDS: ItemId[] = [
  'magnifying_glass',
  'handcuffs',
  'shell_extractor',
  'medical_kit',
]

export const ITEM_LABELS: Record<ItemId, string> = {
  magnifying_glass: 'Magnifying Glass',
  handcuffs: 'Handcuffs',
  shell_extractor: 'Shell Extractor',
  medical_kit: 'Medical Kit',
}

export type Inventory = Record<ItemId, number>

export interface PlayerMemory {
  opponentShots: number
  selfShots: number
  itemUses: number
  recent: Array<'shoot_opponent' | 'shoot_self' | ItemId>
  inspectedThenShotOpponent: number
  inspectedThenShotSelf: number
}

export interface GameState {
  status: MatchStatus
  playerHealth: number
  dealerHealth: number
  maxHealth: number
  shells: ShellType[]
  liveCount: number
  blankCount: number
  round: number
  currentTurn: Actor
  skipTurns: Record<Actor, number>
  inventory: Record<Actor, Inventory>
  knownShell: Record<Actor, ShellType | null>
  inferredShell: ShellType | null
  dealerMode: DealerMode
  memory: PlayerMemory
  dealerActionsThisTurn: number
  lastMessage: string
  lastDialogue: string
  dialogueCooldown: number
  turnIndex: number
}

export type GameAction =
  | { type: 'SHOOT'; actor: Actor; target: Actor }
  | { type: 'USE_ITEM'; actor: Actor; item: ItemId }

export type EngineEvent =
  | { type: 'shot'; actor: Actor; target: Actor; shell: ShellType }
  | { type: 'empty'; actor: Actor; target: Actor }
  | { type: 'damage'; target: Actor }
  | { type: 'heal'; target: Actor }
  | { type: 'inspect'; actor: Actor; shell: ShellType }
  | { type: 'extract'; actor: Actor; shell: ShellType }
  | { type: 'cuff'; actor: Actor; target: Actor }
  | { type: 'reload'; live: number; blank: number }
  | { type: 'turn'; actor: Actor }
  | { type: 'extra_turn'; actor: Actor }
  | { type: 'skip_consumed'; actor: Actor }
  | { type: 'victory' }
  | { type: 'defeat' }
  | { type: 'dialogue'; line: string }
  | { type: 'message'; text: string }

export interface EngineResult {
  ok: boolean
  reason?: string
  state: GameState
  events: EngineEvent[]
}

export interface Probabilities {
  live: number
  blank: number
  total: number
  remainingLive: number
  remainingBlank: number
}
