import { useMemo, useState } from 'react'
import { AudioManager } from './audio/audioManager'
import { CrtOverlay } from './components/CrtOverlay'
import { Credits, HowToPlay, Menu } from './components/Menu'
import { GameScreen } from './components/GameScreen'
import { SettingsPanel } from './components/SettingsPanel'
import type { Screen } from './engine/types'
import { SettingsProvider, useSettings } from './hooks/useSettings'

function Shell() {
  const { settings, update } = useSettings()
  const audio = useMemo(() => new AudioManager(), [])
  const [screen, setScreen] = useState<Screen>('menu')

  const go = (next: Screen) => {
    void audio.unlock()
    if (next === 'game') {
      audio.applySettings(settings)
    }
    setScreen(next)
  }

  return (
    <div className={`app ${settings.crt ? 'with-crt' : ''}`} onPointerDown={() => void audio.unlock()}>
      <div className="room">
        {screen === 'menu' ? <Menu onNavigate={go} /> : null}
        {screen === 'howToPlay' ? <HowToPlay onBack={() => setScreen('menu')} /> : null}
        {screen === 'settings' ? (
          <SettingsPanel settings={settings} onChange={update} onBack={() => setScreen('menu')} />
        ) : null}
        {screen === 'credits' ? <Credits onBack={() => setScreen('menu')} /> : null}
        {screen === 'game' ? (
          <GameScreen audio={audio} settings={settings} onExit={() => setScreen('menu')} />
        ) : null}
      </div>
      <CrtOverlay enabled={settings.crt} />
    </div>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <Shell />
    </SettingsProvider>
  )
}
