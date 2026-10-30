import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './settings'

describe('settings', () => {
  it('persists and reloads', () => {
    const store = new Map<string, string>()
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v)
      },
      removeItem: (k: string) => {
        store.delete(k)
      },
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    }
    saveSettings({ ...DEFAULT_SETTINGS, crt: false, masterVolume: 0.2 })
    expect(loadSettings().crt).toBe(false)
    expect(loadSettings().masterVolume).toBe(0.2)
  })
})
