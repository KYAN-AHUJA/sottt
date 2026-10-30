import type { EngineEvent } from '../engine/types'

export type DealerPose =
  | 'idle'
  | 'look'
  | 'lean'
  | 'damage'
  | 'inventory'
  | 'restrained'
  | 'victory'
  | 'defeat'

export interface AnimCue {
  dealer: DealerPose
  duration: number
  shake: boolean
  fire: boolean
}

export function cueFromEvents(events: EngineEvent[]): AnimCue {
  let dealer: DealerPose = 'look'
  let duration = 420
  let shake = false
  let fire = false
  for (const event of events) {
    if (event.type === 'shot') {
      fire = true
      duration = event.shell === 'LIVE' ? 620 : 380
    }
    if (event.type === 'damage' && event.target === 'dealer') {
      dealer = 'damage'
      shake = true
    }
    if (event.type === 'inspect' || event.type === 'extract' || event.type === 'cuff' || event.type === 'heal') {
      dealer = event.type === 'cuff' ? 'restrained' : 'inventory'
      duration = 480
    }
    if (event.type === 'victory') {
      dealer = 'defeat'
      duration = 900
    }
    if (event.type === 'defeat') {
      dealer = 'victory'
      duration = 900
    }
    if (event.type === 'turn') {
      dealer = event.actor === 'dealer' ? 'lean' : 'look'
    }
  }
  return { dealer, duration, shake, fire }
}
