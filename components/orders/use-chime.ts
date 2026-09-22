// components/orders/use-chime.ts
// The voice of the alert, built with the Web Audio API rather than an audio file: nothing to
// download, nothing to cache, and it works offline. The tune is `chime-pattern.ts`; here is only
// how a note is made — a sine fundamental with two quieter partials above it and a long fade,
// which is what a struck bell does and what a bare beep does not. The notes ring into each other,
// so everything goes through one compressor: the alert stays loud enough for a kitchen without
// the overlaps clipping. A browser will not let a page make noise before it has been touched, so
// the context is created on the first play and the board's "Test sound" button is that touch.
'use client'

import { useCallback, useRef } from 'react'
import { KITCHEN_CHIME, type ChimeNote, type ChimeVoice } from './chime-pattern'

type AudioContextClass = typeof AudioContext
const audioContextClass = (): AudioContextClass | undefined =>
  typeof window === 'undefined' ? undefined : window.AudioContext ?? (window as { webkitAudioContext?: AudioContextClass }).webkitAudioContext

/** A bell's tone is its fundamental plus quieter partials above: the ratio to the note, and its share of the level. */
const PARTIALS = [
  { ratio: 1, share: 1 },
  { ratio: 2, share: 0.3 },
  { ratio: 3, share: 0.1 },
]

/** One partial of a note: struck, then ringing out over the note's whole length. */
function partial(context: AudioContext, bus: GainNode, voice: { at: number; frequency: number; level: number; duration: number }) {
  const { at, frequency, level, duration } = voice
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  // Struck, not faded in: a few milliseconds to full, then a long exponential decay — a bell.
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(level, at + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  oscillator.connect(gain).connect(bus)
  oscillator.start(at)
  oscillator.stop(at + duration + 0.05)
}

/** The bus every note rings into: one gain for the whole alert, then a compressor so the overlaps stay loud rather than clipping. */
function makeBus(context: AudioContext, volume: number): GainNode {
  const bus = context.createGain()
  bus.gain.value = volume
  const compressor = context.createDynamicsCompressor()
  compressor.threshold.value = -18
  compressor.ratio.value = 6
  compressor.attack.value = 0.003
  compressor.release.value = 0.25
  bus.connect(compressor).connect(context.destination)
  return bus
}

/** Rings one note: its fundamental and the partials that make it a bell. */
function ring(context: AudioContext, bus: GainNode, note: ChimeNote, at: number) {
  for (const { ratio, share } of PARTIALS) {
    partial(context, bus, { at, frequency: note.frequency * ratio, level: note.level * share, duration: note.duration })
  }
}

/**
 * Plays an alert; silent, and never throwing, where the browser has no audio or has not been
 * touched yet. `voice` must be a module-level constant (KITCHEN_CHIME, WAITER_CHIME): the
 * returned callback is a poll's dependency, and a fresh object each render would restart its
 * timer on every tick.
 */
export function useChime(voice: ChimeVoice = KITCHEN_CHIME): () => void {
  const context = useRef<AudioContext | null>(null)

  return useCallback(() => {
    try {
      const Ctor = audioContextClass()
      if (!Ctor) return
      context.current ??= new Ctor()
      const ctx = context.current
      // Suspended until the page has been interacted with, and again after a tablet wakes.
      void ctx.resume()
      const bus = makeBus(ctx, voice.volume)
      const start = ctx.currentTime + 0.02
      for (const note of voice.notes) ring(ctx, bus, note, start + note.startsIn)
    } catch {
      // no audio on this device: the board is still readable
    }
  }, [voice])
}
