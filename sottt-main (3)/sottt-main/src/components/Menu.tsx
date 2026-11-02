import type { Screen } from '../engine/types'

export function Menu({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  return (
    <section className="menu-screen">
      <p className="eyebrow">A short match under the city</p>
      <h1 className="title">UNDERGROUND</h1>
      <nav className="menu-nav">
        <button type="button" className="menu-btn" onClick={() => onNavigate('game')}>
          Start Game
        </button>
        <button type="button" className="menu-btn" onClick={() => onNavigate('howToPlay')}>
          How to Play
        </button>
        <button type="button" className="menu-btn" onClick={() => onNavigate('settings')}>
          Settings
        </button>
        <button type="button" className="menu-btn" onClick={() => onNavigate('credits')}>
          Credits
        </button>
      </nav>
    </section>
  )
}

export function HowToPlay({ onBack }: { onBack: () => void }) {
  return (
    <section className="panel-screen">
      <h2>How to Play</h2>
      <ul>
        <li>You and the dealer begin with three health.</li>
        <li>A hidden mix of LIVE and BLANK shells is loaded. Counts are public. Order is not.</li>
        <li>Shoot the dealer or shoot yourself. A blank on yourself keeps your turn.</li>
        <li>Magnifying Glass: privately reveals the current shell.</li>
        <li>Handcuffs: the opponent skips their next turn.</li>
        <li>Shell Extractor: ejects the current shell without firing.</li>
        <li>Medical Kit: restore one health, never above three.</li>
        <li>The dealer does not see the hidden order. Play the odds.</li>
      </ul>
      <button type="button" className="menu-btn" onClick={onBack}>
        Back
      </button>
    </section>
  )
}

export function Credits({ onBack }: { onBack: () => void }) {
  return (
    <section className="panel-screen">
      <h2>Credits</h2>
      <p>UNDERGROUND is an original browser match.</p>
      <p>Atmosphere inspired by high-stakes chamber games, not copied from them.</p>
      <p>Audio is generated in the browser. No third-party tracks required.</p>
      <button type="button" className="menu-btn" onClick={onBack}>
        Back
      </button>
    </section>
  )
}
