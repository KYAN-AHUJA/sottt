export interface GameSettings {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  muted: boolean
  crt: boolean
  screenShake: boolean
  reducedMotion: boolean
}

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.8,
  musicVolume: 0.45,
  sfxVolume: 0.75,
  muted: false,
  crt: true,
  screenShake: true,
  reducedMotion: false,
}

const KEY = 'underground.settings.v1'

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      return { ...DEFAULT_SETTINGS }
    }
    const parsed = JSON.parse(raw) as Partial<GameSettings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings))
}
