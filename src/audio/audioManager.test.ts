import { describe, expect, it } from 'vitest'
import { AudioManager } from './audioManager'
import { DEFAULT_SETTINGS } from '../state/settings'

class FakeOscillator {
  type = 'sine'
  frequency = { value: 0, exponentialRampToValueAtTime() {} }
  connect() {
    return this
  }
  start() {}
  stop() {}
}

class FakeGain {
  gain = {
    value: 0,
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    linearRampToValueAtTime() {},
    cancelScheduledValues() {},
  }
  connect() {
    return this
  }
}

class FakeFilter {
  type = 'lowpass'
  frequency = { value: 0 }
  connect() {
    return this
  }
}

class FakeBuffer {
  getChannelData() {
    return new Float32Array(8)
  }
}

class FakeSource {
  buffer = null
  connect() {
    return this
  }
  start() {}
}

class FakeContext {
  state = 'running'
  currentTime = 0
  sampleRate = 8
  destination = {}
  createGain() {
    return new FakeGain()
  }
  createOscillator() {
    return new FakeOscillator()
  }
  createBiquadFilter() {
    return new FakeFilter()
  }
  createBuffer() {
    return new FakeBuffer()
  }
  createBufferSource() {
    return new FakeSource()
  }
  resume() {
    return Promise.resolve()
  }
  close() {
    return Promise.resolve()
  }
}

describe('audio', () => {
  it('initialises after unlock and applies volume', async () => {
    const audio = new AudioManager(() => new FakeContext() as unknown as AudioContext)
    expect(audio.initialised).toBe(false)
    await audio.unlock()
    expect(audio.initialised).toBe(true)
    audio.applySettings({ ...DEFAULT_SETTINGS, muted: true })
    audio.setTension(1, 3)
    audio.play('fire_live')
    audio.play('heal')
    audio.fadeOut()
    audio.stop()
    expect(audio.initialised).toBe(false)
  })
})
