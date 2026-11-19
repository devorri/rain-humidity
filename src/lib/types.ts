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

export type Tone = 'ok' | 'info' | 'warn' | 'bad' | 'extreme'

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

/* ═══════════════════════════════════════════════════════════════════
 * HEAT INDEX & WIND CHILL THRESHOLDS AND CALCULATIONS
 * ═══════════════════════════════════════════════════════════════════ */

export type HeatIndexLevel = {
  label: string
  range: string
  tone: Tone
  severity: number // 0: Not Hazardous, 1: Caution, 2: Extreme Caution, 3: Danger, 4: Extreme Danger
  description: string
  effect: string
}

export type WindChillLevel = {
  label: string
  range: string
  tone: Tone
  severity: number // 1: Slight Discomfort ... 6: Extreme / Hazardous
  description: string
  effect: string
}

export type ThermalAlert = {
  type: 'heat_index' | 'wind_chill' | 'normal'
  value: number
  label: string
  range: string
  tone: Tone
  isAlert: boolean
  description: string
}

/**
 * Calculates Heat Index in °C from Temperature (°C) and Relative Humidity (%)
 * using the standard NOAA / Rothfusz formula.
 */
export function calculateHeatIndex(tempC: number, humidity: number): number {
  if (tempC < 20) return tempC

  const tf = tempC * 1.8 + 32
  const rh = Math.max(0, Math.min(100, humidity))

  // Preliminary equation
  let hi = 0.5 * (tf + 61.0 + (tf - 68.0) * 1.2 + rh * 0.094)

  // Full Rothfusz regression if 80°F (~26.7°C) or higher
  if ((hi + tf) / 2 >= 80) {
    hi =
      -42.379 +
      2.04901523 * tf +
      10.14333127 * rh -
      0.22475541 * tf * rh -
      0.00683783 * tf * tf -
      0.05481717 * rh * rh +
      0.00122874 * tf * tf * rh +
      0.00085282 * tf * rh * rh -
      0.00000199 * tf * tf * rh * rh

    // Adjustments
    if (rh < 13 && tf >= 80 && tf <= 112) {
      const adj = ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(tf - 95)) / 17)
      hi -= adj
    } else if (rh > 85 && tf >= 80 && tf <= 87) {
      const adj = ((rh - 85) / 10) * ((87 - tf) / 5)
      hi += adj
    }
  }

  const hiC = (hi - 32) / 1.8
  return Number(hiC.toFixed(1))
}

/**
 * Heat Index Thresholds:
 * - Not Hazardous (< 27°C)
 * - Caution (27°C – 32°C)
 * - Extreme Caution (33°C – 41°C)
 * - Danger (42°C – 51°C)
 * - Extreme Danger (≥ 52°C)
 */
export function heatIndexStatus(heatIndexC: number): HeatIndexLevel {
  if (heatIndexC < 27) {
    return {
      label: 'Not Hazardous',
      range: '< 27°C',
      tone: 'ok',
      severity: 0,
      description: 'Normal conditions. Little to no thermal hazard.',
      effect: 'No significant discomfort expected under normal activity.',
    }
  }
  if (heatIndexC <= 32) {
    return {
      label: 'Caution',
      range: '27°C – 32°C',
      tone: 'info',
      severity: 1,
      description: 'Fatigue is possible with prolonged exposure and activity.',
      effect: 'Continuing physical activity could lead to heat cramps.',
    }
  }
  if (heatIndexC <= 41) {
    return {
      label: 'Extreme Caution',
      range: '33°C – 41°C',
      tone: 'warn',
      severity: 2,
      description: 'Heat cramps and heat exhaustion are possible.',
      effect: 'Continuing activity could lead to heat stroke.',
    }
  }
  if (heatIndexC <= 51) {
    return {
      label: 'Danger',
      range: '42°C – 51°C',
      tone: 'bad',
      severity: 3,
      description: 'Heat cramps and heat exhaustion are likely.',
      effect: 'Heat stroke is probable with continued activity.',
    }
  }
  return {
    label: 'Extreme Danger',
    range: '≥ 52°C',
    tone: 'extreme',
    severity: 4,
    description: 'Heat stroke is imminent!',
    effect: 'Cease physical activity immediately. Seek air-conditioned shelter and hydrate.',
  }
}

/**
 * Wind Chill Temperature threshold:
 * - 0°C to -9°C (Slight discomfort)
 * - -10°C to -27°C (Discomfort and caution)
 * - -28°C to -39°C (High risk)
 * - -40°C to -47°C (Very high risk)
 * - -48°C to -54°C (Severe risk)
 * - -55°C or colder (Extreme / Hazardous)
 */
export function windChillStatus(tempC: number): WindChillLevel | null {
  if (tempC > 0) return null
  if (tempC >= -9) {
    return {
      label: 'Slight Discomfort',
      range: '0°C to -9°C',
      tone: 'info',
      severity: 1,
      description: 'Slight discomfort. Low risk of frostbite.',
      effect: 'Dress warmly for extended outdoor activities.',
    }
  }
  if (tempC >= -27) {
    return {
      label: 'Discomfort and Caution',
      range: '-10°C to -27°C',
      tone: 'warn',
      severity: 2,
      description: 'Discomfort and caution.',
      effect: 'Risk of hypothermia if outside for prolonged periods without adequate protection.',
    }
  }
  if (tempC >= -39) {
    return {
      label: 'High Risk',
      range: '-28°C to -39°C',
      tone: 'bad',
      severity: 3,
      description: 'High risk of frostbite.',
      effect: 'Exposed skin can freeze in 10 to 30 minutes. Wear insulated clothing and windproof layers.',
    }
  }
  if (tempC >= -47) {
    return {
      label: 'Very High Risk',
      range: '-40°C to -47°C',
      tone: 'bad',
      severity: 4,
      description: 'Very high risk of frostbite.',
      effect: 'Exposed skin can freeze in 5 to 10 minutes. Avoid unnecessary outdoor exposure.',
    }
  }
  if (tempC >= -54) {
    return {
      label: 'Severe Risk',
      range: '-48°C to -54°C',
      tone: 'extreme',
      severity: 5,
      description: 'Severe risk of frostbite.',
      effect: 'Exposed skin can freeze in 2 to 5 minutes. Outdoor exposure should be avoided.',
    }
  }
  return {
    label: 'Extreme / Hazardous',
    range: '-55°C or colder',
    tone: 'extreme',
    severity: 6,
    description: 'Hazardous conditions.',
    effect: 'Outdoor exposure is dangerous. Exposed skin can freeze in under 2 minutes.',
  }
}

/**
 * Returns the current active thermal alert (Heat Index or Wind Chill)
 */
export function getThermalAlert(tempC: number, humidity: number): ThermalAlert {
  if (tempC <= 0) {
    const wc = windChillStatus(tempC)!
    return {
      type: 'wind_chill',
      value: tempC,
      label: wc.label,
      range: wc.range,
      tone: wc.tone,
      isAlert: true,
      description: `${wc.description} ${wc.effect}`,
    }
  }

  const hi = calculateHeatIndex(tempC, humidity)
  const status = heatIndexStatus(hi)
  return {
    type: 'heat_index',
    value: hi,
    label: status.label,
    range: status.range,
    tone: status.tone,
    isAlert: status.severity > 0,
    description: `${status.description} ${status.effect}`,
  }
}

export const HEAT_INDEX_THRESHOLDS = [
  { range: '< 27°C', label: 'Not Hazardous', tone: 'ok' as Tone, notes: 'Normal conditions, little to no thermal discomfort.' },
  { range: '27°C – 32°C', label: 'Caution', tone: 'info' as Tone, notes: 'Fatigue possible with prolonged exposure and activity. Continued activity could lead to heat cramps.' },
  { range: '33°C – 41°C', label: 'Extreme Caution', tone: 'warn' as Tone, notes: 'Heat cramps and heat exhaustion possible. Continued activity could lead to heat stroke.' },
  { range: '42°C – 51°C', label: 'Danger', tone: 'bad' as Tone, notes: 'Heat cramps and exhaustion likely. Heat stroke probable with continued activity.' },
  { range: '≥ 52°C', label: 'Extreme Danger', tone: 'extreme' as Tone, notes: 'Heat stroke imminent. Cease activity and seek cool shelter immediately.' },
]

export const WIND_CHILL_THRESHOLDS = [
  { range: '0°C to -9°C', label: 'Slight Discomfort', tone: 'info' as Tone, notes: 'Low risk of frostbite for normal outdoor activities.' },
  { range: '-10°C to -27°C', label: 'Discomfort and Caution', tone: 'warn' as Tone, notes: 'Hypothermia risk if outside for long periods without adequate protection.' },
  { range: '-28°C to -39°C', label: 'High Risk', tone: 'bad' as Tone, notes: 'High risk: exposed skin can freeze in 10 to 30 minutes.' },
  { range: '-40°C to -47°C', label: 'Very High Risk', tone: 'bad' as Tone, notes: 'Very high risk: exposed skin can freeze in 5 to 10 minutes.' },
  { range: '-48°C to -54°C', label: 'Severe Risk', tone: 'extreme' as Tone, notes: 'Severe risk: exposed skin can freeze in 2 to 5 minutes.' },
  { range: '-55°C or colder', label: 'Extreme / Hazardous', tone: 'extreme' as Tone, notes: 'Extreme danger: exposed skin can freeze in under 2 minutes.' },
]
