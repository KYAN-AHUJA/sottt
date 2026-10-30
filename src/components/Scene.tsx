import type { DealerPose } from '../animations/animationManager'
import type { GameState } from '../engine/types'
import { Dealer } from './Dealer'

export function Scene({
  state,
  pose,
  firing,
  inspectFlash,
}: {
  state: GameState
  pose: DealerPose
  firing: boolean
  inspectFlash: string | null
}) {
  return (
    <div className="scene">
      <div className="ceiling-lamp" />
      <div className="back-wall" />
      <Dealer pose={pose} restrained={state.skipTurns.dealer > 0} />
      <div className={`table ${firing ? 'firing' : ''}`}>
        <div className="shotgun">
          <span className="barrel" />
          <span className="receiver" />
          <span className="stock" />
        </div>
        <div className="shell-row" aria-label="Remaining shells">
          {state.shells.map((_, i) => (
            <span key={`${state.round}-${i}-${state.shells.length}`} className="shell-unknown" />
          ))}
        </div>
      </div>
      {inspectFlash ? <div className={`inspect-card ${inspectFlash.toLowerCase()}`}>{inspectFlash}</div> : null}
      {state.skipTurns.dealer > 0 ? <div className="restraint-tag">DEALER RESTRAINED</div> : null}
      {state.skipTurns.player > 0 ? <div className="restraint-tag player">YOU ARE RESTRAINED</div> : null}
    </div>
  )
}
