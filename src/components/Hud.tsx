import { getPublicProbabilities } from '../engine/gameEngine'
import type { GameState } from '../engine/types'

function Pips({ value, max, tone }: { value: number; max: number; tone: 'player' | 'dealer' }) {
  return (
    <div className={`pips ${tone}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? 'pip on' : 'pip'} />
      ))}
    </div>
  )
}

export function Hud({ state }: { state: GameState }) {
  const p = getPublicProbabilities(state)
  const livePct = p.total === 0 ? 0 : Math.round(p.live * 100)
  return (
    <header className="hud">
      <div className="hud-block">
        <span className="hud-label">You</span>
        <Pips value={state.playerHealth} max={state.maxHealth} tone="player" />
      </div>
      <div className="hud-center">
        <div className="hud-round">Round {state.round}</div>
        <div className="hud-turn">
          {state.status === 'playing'
            ? state.currentTurn === 'player'
              ? 'Your turn'
              : 'Dealer turn'
            : state.status === 'victory'
              ? 'You leave'
              : 'You stay'}
        </div>
        <div className="hud-odds">
          LIVE {state.liveCount} · BLANK {state.blankCount} · P(LIVE) {livePct}%
        </div>
      </div>
      <div className="hud-block right">
        <span className="hud-label">Dealer</span>
        <Pips value={state.dealerHealth} max={state.maxHealth} tone="dealer" />
      </div>
    </header>
  )
}
