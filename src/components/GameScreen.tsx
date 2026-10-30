import { validateAction } from '../engine/validation'
import type { AudioManager } from '../audio/audioManager'
import { useGame } from '../hooks/useGame'
import type { GameSettings } from '../state/settings'
import { Hud } from './Hud'
import { InventoryBar } from './InventoryBar'
import { Scene } from './Scene'

export function GameScreen({
  audio,
  settings,
  onExit,
}: {
  audio: AudioManager
  settings: GameSettings
  onExit: () => void
}) {
  const game = useGame(audio, settings)
  const { state, busy } = game
  const ended = state.status !== 'playing'
  const playerTurn = state.currentTurn === 'player' && !ended
  const canShootOpp = playerTurn && !validateAction(state, { type: 'SHOOT', actor: 'player', target: 'dealer' })
  const canShootSelf = playerTurn && !validateAction(state, { type: 'SHOOT', actor: 'player', target: 'player' })
  const locked = busy || ended || !playerTurn

  return (
    <section className={`game-screen ${game.shake ? 'shake' : ''} ${settings.reducedMotion ? 'reduced' : ''}`}>
      <Hud state={state} />
      <Scene state={state} pose={game.pose} firing={game.firing} inspectFlash={game.inspectFlash} />
      <p className="dialogue">{state.lastDialogue}</p>
      <p className="message">{state.lastMessage}</p>
      <div className="actions">
        <button type="button" className="action threat" disabled={locked || !canShootOpp} onClick={() => game.shoot('dealer')}>
          Shoot Dealer
        </button>
        <button type="button" className="action" disabled={locked || !canShootSelf} onClick={() => game.shoot('player')}>
          Shoot Yourself
        </button>
      </div>
      <InventoryBar state={state} disabled={locked} onUse={game.useItem} />
      {ended ? (
        <div className="end-card">
          <h2>{state.status === 'victory' ? 'YOU WALK' : 'YOU STAY'}</h2>
          <p>{state.lastMessage}</p>
          <button type="button" className="menu-btn" onClick={() => void game.startMatch()}>
            Play again
          </button>
          <button type="button" className="menu-btn ghost" onClick={onExit}>
            Main menu
          </button>
        </div>
      ) : null}
    </section>
  )
}
