import { type Tone } from './types'

const SOUND_STORAGE_KEY = 'rh_alert_sound_enabled'

export function isSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem(SOUND_STORAGE_KEY)
    return val !== null ? val === 'true' : true // enabled by default
  } catch {
    return true
  }
}

export function setSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, String(enabled))
  } catch {
    /* ignore */
  }
}

/**
 * Synthesizes a clean alert tone using the Web Audio API without needing external sound files.
 */
export function playAlertSound(tone: Tone) {
  if (!isSoundEnabled()) return
  if (typeof window === 'undefined') return

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    const now = ctx.currentTime

    if (tone === 'extreme' || tone === 'bad') {
      // Urgent two-tone beep for Danger / Extreme Danger / High Risk
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(880, now) // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.12) // D6
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc.start(now)
      osc.stop(now + 0.35)
    } else if (tone === 'warn' || tone === 'info') {
      // Gentle warning chime for Caution / Extreme Caution
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, now) // D5
      osc.frequency.setValueAtTime(783.99, now + 0.1) // G5
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
      osc.start(now)
      osc.stop(now + 0.3)
    }
  } catch {
    // AudioContext blocked by browser policy before user interaction
  }
}

/**
 * Checks if desktop notifications are supported.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * Requests desktop notification permission.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

/**
 * Fires a desktop notification if permitted.
 */
export function triggerDesktopNotification(title: string, body: string) {
  if (!isNotificationSupported()) return
  if (Notification.permission !== 'granted') return

  try {
    new Notification(title, {
      body,
      icon: '/logo.png',
      tag: 'rh_alert',
    })
  } catch {
    /* ignore */
  }
}
