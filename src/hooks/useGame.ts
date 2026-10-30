import { useCallback, useEffect, useRef, useState } from 'react'
import { chooseDealerAction, selectDealerMode } from '../ai/dealerAI'
import { cueFromEvents, type DealerPose } from '../animations/animationManager'
import type { AudioManager, SfxName } from '../audio/audioManager'
import { GameEngine, getPublicProbabilities } from '../engine/gameEngine'
import { validateAction } from '../engine/validation'
import type { EngineEvent, GameAction, GameState, ItemId } from '../engine/types'
import type { GameSettings } from '../state/settings'

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function sfxFor(events: EngineEvent[]): SfxName[] {
  const names: SfxName[] = []
  for (const event of events) {
    if (event.type === 'shot') {
      names.push(event.shell === 'LIVE' ? 'fire_live' : 'fire_blank')
    }
    if (event.type === 'damage') names.push('damage')
    if (event.type === 'heal') names.push('heal')
    if (event.type === 'inspect') names.push('inspect')
    if (event.type === 'extract') names.push('extract')
    if (event.type === 'cuff') names.push('cuff')
    if (event.type === 'reload') names.push('load')
    if (event.type === 'turn') names.push('turn')
    if (event.type === 'victory') names.push('victory')
    if (event.type === 'defeat') names.push('defeat')
  }
  return names
}

export function useGame(audio: AudioManager, settings: GameSettings) {
  const engineRef = useRef(new GameEngine())
  const lockRef = useRef(false)
  const [state, setState] = useState<GameState>(() => engineRef.current.getState())
  const [busy, setBusy] = useState(false)
  const [pose, setPose] = useState<DealerPose>('idle')
  const [shake, setShake] = useState(false)
  const [firing, setFiring] = useState(false)
  const [inspectFlash, setInspectFlash] = useState<string | null>(null)

  const sync = useCallback((next: GameState) => {
    next.dealerMode = selectDealerMode(next)
    setState(next)
    audio.setTension(next.playerHealth, next.maxHealth)
  }, [audio])

  // Expose public probabilities for UI components (e.g., HUD)
  const getProbabilities = useCallback(() => {
    return getPublicProbabilities(state)
  }, [state])

  const runEvents = useCallback(
    async (events: EngineEvent[]) => {
      const cue = cueFromEvents(events)
      if (!settings.reducedMotion) {
        setPose(cue.dealer)
        setFiring(cue.fire)
        if (cue.shake && settings.screenShake) {
          setShake(true)
        }
      }
      for (const name of sfxFor(events)) {
        audio.play(name)
      }
      const inspect = events.find((e) => e.type === 'inspect' && e.actor === 'player')
      if (inspect && inspect.type === 'inspect') {
        setInspectFlash(inspect.shell)
      }
      const duration = settings.reducedMotion ? 80 : cue.duration
      await wait(duration)
      setShake(false)
      setFiring(false)
      setInspectFlash(null)
      const ended = events.some((e) => e.type === 'victory' || e.type === 'defeat')
      if (ended) {
        audio.fadeOut()
        setPose(events.some((e) => e.type === 'victory') ? 'defeat' : 'victory')
      } else if (!settings.reducedMotion) {
        setPose('idle')
      }
    },
    [audio, settings.reducedMotion, settings.screenShake],
  )

  const apply = useCallback(
    async (action: GameAction) => {
      const result = engineRef.current.apply(action)
      if (!result.ok) {
        return result.reason ?? 'invalid'
      }
      sync(result.state)
      await runEvents(result.events)
      return null
    },
    [runEvents, sync],
  )

  const dealerLoop = useCallback(async () => {
    let guard = 0
    while (guard < 8) {
      guard += 1
      const current = engineRef.current.getState()
      if (current.status !== 'playing' || current.currentTurn !== 'dealer') {
        break
      }
      audio.play('dealer')
      await wait(settings.reducedMotion ? 120 : 520)
      const action = chooseDealerAction(engineRef.current.getState())
      const reason = await apply(action)
      if (reason) {
        break
      }
    }
  }, [apply, audio, settings.reducedMotion])

  const act = useCallback(
    async (action: GameAction) => {
      if (lockRef.current) {
        return
      }
      const snapshot = engineRef.current.getState()
      const invalid = validateAction(snapshot, action)
      if (invalid) {
        return
      }
      lockRef.current = true
      setBusy(true)
      try {
        await apply(action)
        await dealerLoop()
      } finally {
        lockRef.current = false
        setBusy(false)
      }
    },
    [apply, dealerLoop],
  )

  const startMatch = useCallback(async () => {
    lockRef.current = false
    setBusy(false)
    setPose('idle')
    const next = engineRef.current.startMatch()
    sync(next)
    audio.play('load')
  }, [audio, sync])

  const shoot = useCallback(
    (target: 'player' | 'dealer') => {
      void act({ type: 'SHOOT', actor: 'player', target })
    },
    [act],
  )

  const useItem = useCallback(
    (item: ItemId) => {
      void act({ type: 'USE_ITEM', actor: 'player', item })
    },
    [act],
  )

  useEffect(() => {
    audio.applySettings(settings)
  }, [audio, settings])

  return {
    state,
    busy,
    pose,
    shake,
    firing,
    inspectFlash,
    shoot,
    useItem,
    getProbabilities,
  }
}
