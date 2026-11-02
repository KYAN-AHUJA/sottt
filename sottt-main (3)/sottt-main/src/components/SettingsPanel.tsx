import type { GameSettings } from '../state/settings'

export function SettingsPanel({
  settings,
  onChange,
  onBack,
}: {
  settings: GameSettings
  onChange: (patch: Partial<GameSettings>) => void
  onBack: () => void
}) {
  return (
    <section className="panel-screen">
      <h2>Settings</h2>
      <label>
        Master volume
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={settings.masterVolume}
          onChange={(e) => onChange({ masterVolume: Number(e.target.value) })}
        />
      </label>
      <label>
        Music volume
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={settings.musicVolume}
          onChange={(e) => onChange({ musicVolume: Number(e.target.value) })}
        />
      </label>
      <label>
        Sound effects
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={settings.sfxVolume}
          onChange={(e) => onChange({ sfxVolume: Number(e.target.value) })}
        />
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={settings.muted}
          onChange={(e) => onChange({ muted: e.target.checked })}
        />
        Mute
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={settings.crt}
          onChange={(e) => onChange({ crt: e.target.checked })}
        />
        CRT effect
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={settings.screenShake}
          onChange={(e) => onChange({ screenShake: e.target.checked })}
        />
        Screen shake
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={settings.reducedMotion}
          onChange={(e) => onChange({ reducedMotion: e.target.checked })}
        />
        Reduced motion
      </label>
      <button type="button" className="menu-btn" onClick={onBack}>
        Back
      </button>
    </section>
  )
}
