import type { GameSettings } from '../state/settings'

type Tone = OscillatorType

export class AudioManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private music: GainNode | null = null
  private sfx: GainNode | null = null
  private ambientNodes: AudioNode[] = []
  private heartbeat: OscillatorNode | null = null
  private heartGain: GainNode | null = null
  private started = false
  private settings: GameSettings | null = null
  private droneGain: GainNode | null = null
  private factory: () => AudioContext

  constructor(factory: () => AudioContext = () => new AudioContext()) {
    this.factory = factory
  }

  get initialised(): boolean {
    return this.started
  }

  async unlock(): Promise<void> {
    if (this.started && this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume()
      }
      return
    }
    const ctx = this.factory()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.music = ctx.createGain()
    this.sfx = ctx.createGain()
    this.music.connect(this.master)
    this.sfx.connect(this.master)
    this.master.connect(ctx.destination)
    this.started = true
    if (this.settings) {
      this.applySettings(this.settings)
    }
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    this.startAmbient()
  }

  applySettings(settings: GameSettings): void {
    this.settings = settings
    if (!this.master || !this.music || !this.sfx) {
      return
    }
    const mute = settings.muted ? 0 : 1
    this.master.gain.value = settings.masterVolume * mute
    this.music.gain.value = settings.musicVolume
    this.sfx.gain.value = settings.sfxVolume
  }

  setTension(playerHealth: number, maxHealth: number): void {
    if (!this.ctx) {
      return
    }
    const now = this.ctx.currentTime
    if (this.heartGain) {
      const level = playerHealth <= 1 ? 0.08 : playerHealth <= 2 ? 0.03 : 0
      this.heartGain.gain.cancelScheduledValues(now)
      this.heartGain.gain.linearRampToValueAtTime(level, now + 0.3)
    }
    if (this.droneGain) {
      const drone = playerHealth <= 1 ? 0.12 : playerHealth <= 2 ? 0.09 : 0.07
      this.droneGain.gain.cancelScheduledValues(now)
      this.droneGain.gain.linearRampToValueAtTime(drone, now + 0.4)
    }
  }

  fadeOut(): void {
    if (!this.music || !this.ctx) {
      return
    }
    const now = this.ctx.currentTime
    this.music.gain.linearRampToValueAtTime(0.05, now + 0.8)
  }

  play(name: SfxName): void {
    if (!this.ctx || !this.sfx) {
      return
    }
    const fn = SFX[name]
    fn(this.ctx, this.sfx)
  }

  stop(): void {
    for (const node of this.ambientNodes) {
      try {
        node.disconnect()
      } catch {
        /* ignore teardown */
      }
    }
    this.ambientNodes = []
    this.heartbeat?.stop()
    this.heartbeat = null
    void this.ctx?.close()
    this.ctx = null
    this.started = false
  }

  private startAmbient(): void {
    if (!this.ctx || !this.music) {
      return
    }
    const drone = this.ctx.createOscillator()
    drone.type = 'sawtooth'
    drone.frequency.value = 46
    const droneFilter = this.ctx.createBiquadFilter()
    droneFilter.type = 'lowpass'
    droneFilter.frequency.value = 180
    const droneGain = this.ctx.createGain()
    droneGain.gain.value = 0.07
    this.droneGain = droneGain
    drone.connect(droneFilter).connect(droneGain).connect(this.music)
    drone.start()

    const buzz = this.ctx.createOscillator()
    buzz.type = 'square'
    buzz.frequency.value = 110
    const buzzGain = this.ctx.createGain()
    buzzGain.gain.value = 0.012
    const buzzFilter = this.ctx.createBiquadFilter()
    buzzFilter.type = 'highpass'
    buzzFilter.frequency.value = 800
    buzz.connect(buzzFilter).connect(buzzGain).connect(this.music)
    buzz.start()

    const creak = this.ctx.createOscillator()
    creak.type = 'triangle'
    creak.frequency.value = 180
    const creakLfo = this.ctx.createOscillator()
    creakLfo.frequency.value = 0.07
    const creakDepth = this.ctx.createGain()
    creakDepth.gain.value = 12
    creakLfo.connect(creakDepth).connect(creak.frequency)
    const creakGain = this.ctx.createGain()
    creakGain.gain.value = 0.02
    creak.connect(creakGain).connect(this.music)
    creak.start()
    creakLfo.start()

    this.heartGain = this.ctx.createGain()
    this.heartGain.gain.value = 0
    this.heartbeat = this.ctx.createOscillator()
    this.heartbeat.type = 'sine'
    this.heartbeat.frequency.value = 2.2
    const pulse = this.ctx.createGain()
    pulse.gain.value = 0.5
    this.heartbeat.connect(pulse).connect(this.heartGain).connect(this.music)
    this.heartbeat.start()

    this.ambientNodes.push(
      drone,
      droneFilter,
      droneGain,
      buzz,
      buzzGain,
      buzzFilter,
      creak,
      creakLfo,
      creakGain,
      this.heartbeat,
      pulse,
      this.heartGain,
    )
  }
}

export type SfxName =
  | 'click'
  | 'load'
  | 'inspect'
  | 'extract'
  | 'fire_live'
  | 'fire_blank'
  | 'damage'
  | 'heal'
  | 'cuff'
  | 'turn'
  | 'victory'
  | 'defeat'
  | 'dealer'

function beep(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  duration: number,
  type: Tone,
  gain = 0.12,
  slide?: number,
): void {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.value = gain
  osc.connect(g).connect(dest)
  const now = ctx.currentTime
  g.gain.setValueAtTime(gain, now)
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  if (slide) {
    osc.frequency.exponentialRampToValueAtTime(slide, now + duration)
  }
  osc.start(now)
  osc.stop(now + duration + 0.02)
}

function noise(ctx: AudioContext, dest: AudioNode, duration: number, gain = 0.08): void {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1
  }
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const g = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 900
  g.gain.value = gain
  src.connect(filter).connect(g).connect(dest)
  const now = ctx.currentTime
  g.gain.setValueAtTime(gain, now)
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  src.start(now)
}

const SFX: Record<SfxName, (ctx: AudioContext, dest: AudioNode) => void> = {
  click: (ctx, dest) => beep(ctx, dest, 420, 0.05, 'square', 0.04),
  load: (ctx, dest) => {
    beep(ctx, dest, 140, 0.12, 'square', 0.08, 90)
    noise(ctx, dest, 0.1, 0.04)
  },
  inspect: (ctx, dest) => beep(ctx, dest, 880, 0.18, 'sine', 0.05, 1200),
  extract: (ctx, dest) => {
    beep(ctx, dest, 220, 0.16, 'sawtooth', 0.07, 80)
    noise(ctx, dest, 0.12, 0.05)
  },
  fire_live: (ctx, dest) => {
    noise(ctx, dest, 0.28, 0.2)
    beep(ctx, dest, 90, 0.25, 'sawtooth', 0.16, 40)
  },
  fire_blank: (ctx, dest) => beep(ctx, dest, 70, 0.1, 'square', 0.06),
  damage: (ctx, dest) => beep(ctx, dest, 60, 0.3, 'sawtooth', 0.14, 30),
  heal: (ctx, dest) => beep(ctx, dest, 420, 0.22, 'sine', 0.06, 640),
  cuff: (ctx, dest) => beep(ctx, dest, 180, 0.12, 'square', 0.07),
  turn: (ctx, dest) => beep(ctx, dest, 240, 0.08, 'triangle', 0.04),
  victory: (ctx, dest) => {
    beep(ctx, dest, 330, 0.2, 'triangle', 0.08, 440)
    beep(ctx, dest, 440, 0.35, 'triangle', 0.07, 660)
  },
  defeat: (ctx, dest) => beep(ctx, dest, 110, 0.5, 'sawtooth', 0.1, 40),
  dealer: (ctx, dest) => beep(ctx, dest, 90, 0.16, 'sine', 0.03),
}
