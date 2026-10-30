import { pickDialogue } from '../ai/dialogue'
import { applyDamage, applyHeal, isDead, MAX_HEALTH, START_HEALTH } from './health'
import { cloneInventory, opponentOf, startingInventory } from './inventory'
import type { Rng } from './rng'
import { SystemRng } from './rng'
import { calculateProbabilities } from './probability'
import { consumeShell, generateChamber, peekShell } from './shells'
import type {
  Actor,
  EngineEvent,
  EngineResult,
  GameAction,
  GameState,
  ItemId,
  PlayerMemory,
} from './types'
import { validateAction } from './validation'

function cloneState(state: GameState): GameState {
  return {
    ...state,
    shells: [...state.shells],
    skipTurns: { ...state.skipTurns },
    inventory: {
      player: cloneInventory(state.inventory.player),
      dealer: cloneInventory(state.inventory.dealer),
    },
    knownShell: { ...state.knownShell },
    memory: {
      ...state.memory,
      recent: [...state.memory.recent],
    },
  }
}

function blankMemory(): PlayerMemory {
  return {
    opponentShots: 0,
    selfShots: 0,
    itemUses: 0,
    recent: [],
    inspectedThenShotOpponent: 0,
    inspectedThenShotSelf: 0,
  }
}

function applyChamber(state: GameState, liveCount: number, blankCount: number, shells: GameState['shells']) {
  state.liveCount = liveCount
  state.blankCount = blankCount
  state.shells = shells
  state.knownShell.player = null
  state.knownShell.dealer = null
  state.inferredShell = null
}

function reload(state: GameState, rng: Rng, events: EngineEvent[]) {
  const chamber = generateChamber(rng)
  state.round += 1
  applyChamber(state, chamber.liveCount, chamber.blankCount, chamber.shells)
  events.push({
    type: 'reload',
    live: chamber.liveCount,
    blank: chamber.blankCount,
  })
  events.push({
    type: 'message',
    text: `Round ${state.round}: ${chamber.liveCount} live, ${chamber.blankCount} blank.`,
  })
}

function maybeReload(state: GameState, rng: Rng, events: EngineEvent[]) {
  if (state.status !== 'playing') {
    return
  }
  if (state.shells.length === 0) {
    reload(state, rng, events)
  }
}

function finishIfDead(state: GameState, events: EngineEvent[]) {
  if (isDead(state.playerHealth)) {
    state.status = 'defeat'
    state.lastMessage = 'The chamber goes dark.'
    events.push({ type: 'defeat' })
    events.push({ type: 'message', text: state.lastMessage })
    return
  }
  if (isDead(state.dealerHealth)) {
    state.status = 'victory'
    state.lastMessage = 'The dealer slumps. You walk out.'
    events.push({ type: 'victory' })
    events.push({ type: 'message', text: state.lastMessage })
  }
}

function rememberPlayer(state: GameState, kind: PlayerMemory['recent'][number]) {
  state.memory.recent = [...state.memory.recent.slice(-7), kind]
  if (kind === 'shoot_opponent') {
    state.memory.opponentShots += 1
  } else if (kind === 'shoot_self') {
    state.memory.selfShots += 1
  } else {
    state.memory.itemUses += 1
  }
}

function resolveTurnAfterShot(
  state: GameState,
  actor: Actor,
  target: Actor,
  shell: GameState['shells'][number],
  events: EngineEvent[],
) {
  if (state.status !== 'playing') {
    return
  }
  const extraTurn = shell === 'BLANK' && target === actor
  if (extraTurn) {
    events.push({ type: 'extra_turn', actor })
    events.push({ type: 'message', text: 'Blank. The turn stays.' })
    consumeSkipIfNeeded(state, actor, events)
    return
  }
  passTurn(state, actor, events)
}

function consumeSkipIfNeeded(state: GameState, actor: Actor, events: EngineEvent[]) {
  if (state.skipTurns[actor] > 0) {
    state.skipTurns[actor] -= 1
    events.push({ type: 'skip_consumed', actor })
  }
}

function passTurn(state: GameState, actor: Actor, events: EngineEvent[]) {
  const next = opponentOf(actor)
  if (state.skipTurns[next] > 0) {
    state.skipTurns[next] -= 1
    events.push({ type: 'skip_consumed', actor: next })
    events.push({ type: 'turn', actor })
    events.push({ type: 'message', text: `${next === 'dealer' ? 'Dealer' : 'You'} skip a turn.` })
    state.currentTurn = actor
    if (actor === 'dealer') {
      state.dealerActionsThisTurn += 1
    } else {
      state.dealerActionsThisTurn = 0
    }
    return
  }
  state.currentTurn = next
  state.dealerActionsThisTurn = next === 'dealer' ? 0 : 0
  events.push({ type: 'turn', actor: next })
}

function decrementItem(state: GameState, actor: Actor, item: ItemId) {
  const next = Math.max(0, state.inventory[actor][item] - 1)
  state.inventory[actor][item] = next
}

function attachDialogue(state: GameState, events: EngineEvent[], trigger: string) {
  if (state.status !== 'playing') {
    return
  }
  const line = pickDialogue(state, trigger)
  if (!line) {
    return
  }
  state.lastDialogue = line
  state.dialogueCooldown = 2
  events.push({ type: 'dialogue', line })
}

export function createMatch(rng: Rng = new SystemRng()): GameState {
  const chamber = generateChamber(rng)
  const state: GameState = {
    status: 'playing',
    playerHealth: START_HEALTH,
    dealerHealth: START_HEALTH,
    maxHealth: MAX_HEALTH,
    shells: chamber.shells,
    liveCount: chamber.liveCount,
    blankCount: chamber.blankCount,
    round: 1,
    currentTurn: 'player',
    skipTurns: { player: 0, dealer: 0 },
    inventory: {
      player: startingInventory(),
      dealer: startingInventory(),
    },
    knownShell: { player: null, dealer: null },
    inferredShell: null,
    dealerMode: 'CALCULATED',
    memory: blankMemory(),
    dealerActionsThisTurn: 0,
    lastMessage: `Round 1: ${chamber.liveCount} live, ${chamber.blankCount} blank.`,
    lastDialogue: 'Sit. We play until one of us does not.',
    dialogueCooldown: 0,
    turnIndex: 0,
  }
  return state
}

export function getPublicProbabilities(state: GameState) {
  return calculateProbabilities({
    shells: state.shells,
    liveCount: state.liveCount,
    blankCount: state.blankCount,
  })
}

export function applyAction(
  prev: GameState,
  action: GameAction,
  rng: Rng = new SystemRng(),
): EngineResult {
  const state = cloneState(prev)
  const reason = validateAction(state, action)
  if (reason) {
    return { ok: false, reason, state: prev, events: [] }
  }

  const events: EngineEvent[] = []
  if (state.dialogueCooldown > 0) {
    state.dialogueCooldown -= 1
  }
  state.turnIndex += 1

  if (action.type === 'SHOOT') {
    const knew = state.knownShell[action.actor]
    const chamber = consumeShell({
      shells: state.shells,
      liveCount: state.liveCount,
      blankCount: state.blankCount,
    })
    applyChamber(state, chamber.chamber.liveCount, chamber.chamber.blankCount, chamber.chamber.shells)
    const shell = chamber.shell
    events.push({
      type: 'shot',
      actor: action.actor,
      target: action.target,
      shell,
    })
    if (shell === 'LIVE') {
      if (action.target === 'player') {
        state.playerHealth = applyDamage(state.playerHealth)
      } else {
        state.dealerHealth = applyDamage(state.dealerHealth)
      }
      events.push({ type: 'damage', target: action.target })
      events.push({
        type: 'message',
        text: action.target === action.actor ? 'Live. Self-inflicted.' : 'Live round.',
      })
      attachDialogue(state, events, 'live_shot')
    } else {
      events.push({
        type: 'empty',
        actor: action.actor,
        target: action.target,
      })
      events.push({
        type: 'message',
        text: action.target === action.actor ? 'Blank. You keep the chamber.' : 'Blank. Nothing.',
      })
      attachDialogue(state, events, 'blank_shot')
    }

    if (action.actor === 'player') {
      rememberPlayer(state, action.target === 'player' ? 'shoot_self' : 'shoot_opponent')
      if (knew) {
        if (action.target === 'dealer') {
          state.memory.inspectedThenShotOpponent += 1
        } else {
          state.memory.inspectedThenShotSelf += 1
        }
      }
    }

    finishIfDead(state, events)
    maybeReload(state, rng, events)
    resolveTurnAfterShot(state, action.actor, action.target, shell, events)
    return { ok: true, state, events }
  }

  const item = action.item
  decrementItem(state, action.actor, item)
  if (action.actor === 'player') {
    rememberPlayer(state, item)
  } else {
    state.dealerActionsThisTurn += 1
  }

  if (item === 'magnifying_glass') {
    const shell = peekShell({
      shells: state.shells,
      liveCount: state.liveCount,
      blankCount: state.blankCount,
    })
    state.knownShell[action.actor] = shell
    events.push({ type: 'inspect', actor: action.actor, shell })
    events.push({
      type: 'message',
      text:
        action.actor === 'player'
          ? `The current shell is ${shell}.`
          : 'The dealer studies the chamber.',
    })
    attachDialogue(state, events, 'inspect')
  } else if (item === 'handcuffs') {
    const target = opponentOf(action.actor)
    state.skipTurns[target] += 1
    events.push({ type: 'cuff', actor: action.actor, target })
    events.push({
      type: 'message',
      text: target === 'dealer' ? 'Dealer restrained.' : 'You are restrained.',
    })
    attachDialogue(state, events, 'cuffs')
  } else if (item === 'shell_extractor') {
    const chamber = consumeShell({
      shells: state.shells,
      liveCount: state.liveCount,
      blankCount: state.blankCount,
    })
    applyChamber(state, chamber.chamber.liveCount, chamber.chamber.blankCount, chamber.chamber.shells)
    events.push({ type: 'extract', actor: action.actor, shell: chamber.shell })
    events.push({
      type: 'message',
      text:
        action.actor === 'player'
          ? `Extracted a ${chamber.shell} shell.`
          : 'The dealer ejects a shell.',
    })
    attachDialogue(state, events, 'extract')
    finishIfDead(state, events)
    maybeReload(state, rng, events)
  } else if (item === 'medical_kit') {
    if (action.actor === 'player') {
      state.playerHealth = applyHeal(state.playerHealth, state.maxHealth)
    } else {
      state.dealerHealth = applyHeal(state.dealerHealth, state.maxHealth)
    }
    events.push({ type: 'heal', target: action.actor })
    events.push({
      type: 'message',
      text: action.actor === 'player' ? 'One point restored.' : 'The dealer patches a wound.',
    })
    attachDialogue(state, events, 'heal')
  }

  return { ok: true, state, events }
}

export class GameEngine {
  private state: GameState
  private rng: Rng

  constructor(rng: Rng = new SystemRng(), initial?: GameState) {
    this.rng = rng
    this.state = initial ? cloneState(initial) : createMatch(rng)
  }

  getState(): GameState {
    return cloneState(this.state)
  }

  startMatch(): GameState {
    this.state = createMatch(this.rng)
    return this.getState()
  }

  apply(action: GameAction): EngineResult {
    const result = applyAction(this.state, action, this.rng)
    if (result.ok) {
      this.state = result.state
    }
    return { ...result, state: this.getState() }
  }
}
