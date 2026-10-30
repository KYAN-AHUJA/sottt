import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type GameSettings } from '../state/settings'

interface SettingsContextValue {
  settings: GameSettings
  update: (patch: Partial<GameSettings>) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GameSettings>(() =>
    typeof localStorage === 'undefined' ? DEFAULT_SETTINGS : loadSettings(),
  )

  const value = useMemo<SettingsContextValue>(() => {
    return {
      settings,
      update: (patch) => {
        setSettings((prev) => {
          const next = { ...prev, ...patch }
          saveSettings(next)
          return next
        })
      },
    }
  }, [settings])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error('useSettings requires SettingsProvider')
  }
  return ctx
}
