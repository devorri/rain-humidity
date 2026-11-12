export const APP_NAME = 'HumidiSense'
export const APP_TAGLINE = 'Rain & Humidity Monitoring System'
export const BRAND_A = 'Humidi'
export const BRAND_B = 'Sense'
export const LOGO_SRC = '/logo.png'

export type Reading = {
  id: number
  rain_percent: number
  temperature: number
  humidity: number
  created_at: string
}

export type Tone = 'ok' | 'info' | 'warn' | 'bad'

/** Rain sensor is stored as 0–100 %. */
export function rainStatus(percent: number): { label: string; tone: Tone } {
  if (percent <= 10) return { label: 'No Rain', tone: 'ok' }
  if (percent <= 40) return { label: 'Light Rain', tone: 'info' }
  if (percent <= 70) return { label: 'Moderate Rain', tone: 'warn' }
  return { label: 'Heavy Rain', tone: 'bad' }
}

export function normalizeReading(r: Reading): Reading {
  return {
    ...r,
    rain_percent: Number(r.rain_percent),
    temperature: Number(r.temperature),
    humidity: Number(r.humidity),
  }
}

const TZ = 'Asia/Manila'

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    timeZone: TZ,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function timeAgo(iso: string, nowMs: number) {
  const s = Math.max(0, Math.round((nowMs - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hr ago`
  return `${Math.round(h / 24)} day(s) ago`
}

/** Device counts as online if the last reading is newer than this. */
export const ONLINE_WINDOW_MS = 60_000
