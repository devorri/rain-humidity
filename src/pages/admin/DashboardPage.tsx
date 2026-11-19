import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CloudRain,
  Droplets,
  Thermometer,
  Clock,
  RefreshCw,
  Flame,
  Snowflake,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react'
import { supabase, READINGS_TABLE, friendlyError } from '../../lib/supabase'
import {
  formatTime,
  getThermalAlert,
  HEAT_INDEX_THRESHOLDS,
  normalizeReading,
  ONLINE_WINDOW_MS,
  rainStatus,
  timeAgo,
  WIND_CHILL_THRESHOLDS,
  type Reading,
} from '../../lib/types'
import {
  isNotificationSupported,
  isSoundEnabled,
  playAlertSound,
  requestNotificationPermission,
  setSoundEnabled,
  triggerDesktopNotification,
} from '../../lib/alerts'
import ReadingsList from '../../components/ReadingsList'
import TrendChart from '../../components/TrendChart'

const REFRESH_MS = 5000
const TREND_POINTS = 30

type Summary = {
  count: number
  avgTemp: number
  minTemp: number
  maxTemp: number
  avgHum: number
  maxRain: number
  rainyCount: number
}

function summarize(rows: Reading[]): Summary | null {
  if (!rows.length) return null
  const temps = rows.map((r) => r.temperature)
  const hums = rows.map((r) => r.humidity)
  const rains = rows.map((r) => r.rain_percent)
  const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length
  return {
    count: rows.length,
    avgTemp: avg(temps),
    minTemp: Math.min(...temps),
    maxTemp: Math.max(...temps),
    avgHum: avg(hums),
    maxRain: Math.max(...rains),
    rainyCount: rains.filter((r) => r > 10).length,
  }
}

export default function DashboardPage() {
  const [recent, setRecent] = useState<Reading[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [nowMs, setNowMs] = useState(() => Date.now())

  // Alert settings & state
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled())
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    isNotificationSupported() ? Notification.permission : 'denied',
  )
  const [showGuide, setShowGuide] = useState(false)
  const [guideTab, setGuideTab] = useState<'heat' | 'wind'>('heat')
  const lastAlertReadingId = useRef<number | null>(null)

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const [recentRes, dayRes] = await Promise.all([
      supabase.from(READINGS_TABLE).select('*').order('created_at', { ascending: false }).limit(TREND_POINTS),
      supabase
        .from(READINGS_TABLE)
        .select('rain_percent, temperature, humidity, created_at, id')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20000),
    ])
    if (recentRes.error) {
      setError(friendlyError(recentRes.error))
    } else {
      setError(null)
      const data = (recentRes.data as Reading[]).map(normalizeReading)
      setRecent(data)

      // Trigger notification if the newest reading is an alert and hasn't been notified yet
      if (data.length > 0) {
        const top = data[0]
        const thermal = getThermalAlert(top.temperature, top.humidity)
        if (thermal.isAlert && lastAlertReadingId.current !== top.id) {
          lastAlertReadingId.current = top.id
          playAlertSound(thermal.tone)
          const alertType = thermal.type === 'wind_chill' ? '❄️ Wind Chill Alert' : '🔥 Heat Index Alert'
          triggerDesktopNotification(
            `${alertType}: ${thermal.label} (${thermal.value.toFixed(1)}°C)`,
            thermal.description,
          )
        }
      }
    }
    if (!dayRes.error) setSummary(summarize((dayRes.data as Reading[]).map(normalizeReading)))
    setLoading(false)
  }, [])

  useEffect(() => {
    const first = window.setTimeout(() => void load(), 0)
    const t = window.setInterval(() => void load(), REFRESH_MS)
    const tick = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(t)
      window.clearInterval(tick)
    }
  }, [load])

  function toggleSound() {
    const next = !soundOn
    setSoundOn(next)
    setSoundEnabled(next)
    if (next) playAlertSound('info')
  }

  async function handleEnableNotifications() {
    const perm = await requestNotificationPermission()
    setNotifPermission(perm)
    if (perm === 'granted') {
      triggerDesktopNotification(
        'Alert Notifications Active',
        'You will receive notifications when readings cross safety thresholds.',
      )
    }
  }

  const now = recent[0]
  const online = now ? nowMs - new Date(now.created_at).getTime() < ONLINE_WINDOW_MS : false
  const status = now ? rainStatus(now.rain_percent) : null
  const thermal = now ? getThermalAlert(now.temperature, now.humidity) : null
  const dash = loading ? '—' : 'No data'

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="lede">Live readings from the sensor with real-time threshold alerts. Updates every 5 seconds.</p>
        </div>
        <div className="header-actions">
          <span className={`badge ${online ? 'ok' : 'bad'}`}>
            <span className={`dot ${online ? 'on' : ''}`} /> Device {online ? 'Online' : 'Offline'}
          </span>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={toggleSound}
            title={soundOn ? 'Alert chime is enabled. Click to mute.' : 'Alert chime is muted. Click to enable.'}
          >
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            {soundOn ? 'Sound On' : 'Muted'}
          </button>
          {isNotificationSupported() && (
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={handleEnableNotifications}
              title={
                notifPermission === 'granted'
                  ? 'Desktop alerts enabled'
                  : 'Click to enable browser desktop notifications'
              }
            >
              {notifPermission === 'granted' ? <Bell size={15} /> : <BellOff size={15} />}
              {notifPermission === 'granted' ? 'Alerts On' : 'Enable Push'}
            </button>
          )}
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => setShowGuide(!showGuide)}
            title="View threshold guides"
          >
            <HelpCircle size={15} /> Thresholds
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => void load()}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert bad">{error}</div>}

      {/* ══════ PROMINENT ALERT BANNER ══════ */}
      {now && thermal && thermal.isAlert && (
        <div className={`alert-banner ${thermal.tone}`}>
          <div className="alert-banner-left">
            <span className="alert-banner-icon">
              {thermal.type === 'wind_chill' ? (
                <Snowflake size={24} />
              ) : (
                <AlertTriangle size={24} />
              )}
            </span>
            <div>
              <div className="alert-banner-title">
                {thermal.type === 'wind_chill' ? '❄️ Wind Chill Advisory' : '⚠️ Heat Index Alert'}:{' '}
                <span className="alert-banner-level">{thermal.label}</span> ({thermal.value.toFixed(1)}°C)
              </div>
              <p className="alert-banner-desc">{thermal.description}</p>
            </div>
          </div>
          <div className="alert-banner-actions">
            <button type="button" className="alert-ctrl-btn" onClick={toggleSound}>
              {soundOn ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {soundOn ? 'Mute' : 'Unmute'}
            </button>
            <button type="button" className="alert-ctrl-btn" onClick={() => setShowGuide(true)}>
              View Scale
            </button>
          </div>
        </div>
      )}

      {/* ══════ STATS GRID ══════ */}
      <div className="stat-grid">
        <div className="stat">
          <div className="stat-top">
            <span className="label">Rain Level</span>
            <CloudRain size={20} className="stat-icon" />
          </div>
          <div className="value">{now ? `${now.rain_percent}%` : dash}</div>
          {now && (
            <>
              <div className="meter">
                <div className={`meter-fill ${status?.tone}`} style={{ width: `${now.rain_percent}%` }} />
              </div>
              <span className={`badge ${status?.tone}`}>{status?.label}</span>
            </>
          )}
        </div>

        <div className="stat">
          <div className="stat-top">
            <span className="label">Temperature</span>
            <Thermometer size={20} className="stat-icon" />
          </div>
          <div className="value">{now ? `${now.temperature.toFixed(1)}°C` : dash}</div>
          {summary && (
            <span className="stat-sub">
              24h: {summary.minTemp.toFixed(1)}° – {summary.maxTemp.toFixed(1)}°
            </span>
          )}
        </div>

        <div className="stat">
          <div className="stat-top">
            <span className="label">Humidity</span>
            <Droplets size={20} className="stat-icon" />
          </div>
          <div className="value">{now ? `${now.humidity.toFixed(1)}%` : dash}</div>
          {now && (
            <div className="meter">
              <div className="meter-fill info" style={{ width: `${Math.min(100, now.humidity)}%` }} />
            </div>
          )}
        </div>

        <div className="stat">
          <div className="stat-top">
            <span className="label">
              {thermal?.type === 'wind_chill' ? 'Wind Chill Temp' : 'Heat Index'}
            </span>
            {thermal?.type === 'wind_chill' ? (
              <Snowflake size={20} className="stat-icon" />
            ) : (
              <Flame size={20} className="stat-icon" />
            )}
          </div>
          <div className="value">{thermal ? `${thermal.value.toFixed(1)}°C` : dash}</div>
          {thermal && (
            <>
              <div className="meter">
                <div
                  className={`meter-fill ${thermal.tone}`}
                  style={{
                    width: `${Math.min(100, Math.max(10, ((thermal.value - 20) / 35) * 100))}%`,
                  }}
                />
              </div>
              <span className={`badge ${thermal.tone}`}>{thermal.label}</span>
            </>
          )}
        </div>

        <div className="stat">
          <div className="stat-top">
            <span className="label">Last Update</span>
            <Clock size={20} className="stat-icon" />
          </div>
          <div className="value value-sm">{now ? formatTime(now.created_at) : dash}</div>
          {now && <span className="stat-sub">{timeAgo(now.created_at, nowMs)}</span>}
        </div>
      </div>

      {/* ══════ THRESHOLD REFERENCE CARD ══════ */}
      {showGuide && (
        <div className="panel">
          <div className="section-head" style={{ marginBottom: '1rem' }}>
            <h3 className="panel-title" style={{ margin: 0 }}>
              Threshold & Notification Reference Guidelines
            </h3>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => setShowGuide(false)}
            >
              Hide
            </button>
          </div>
          <div className="guide-tabs">
            <button
              type="button"
              className={`guide-tab ${guideTab === 'heat' ? 'active' : ''}`}
              onClick={() => setGuideTab('heat')}
            >
              Heat Index Thresholds
            </button>
            <button
              type="button"
              className={`guide-tab ${guideTab === 'wind' ? 'active' : ''}`}
              onClick={() => setGuideTab('wind')}
            >
              Wind Chill Thresholds
            </button>
          </div>

          <div className="table-wrap">
            {guideTab === 'heat' ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Threshold Range</th>
                    <th>Classification</th>
                    <th>Alert Status</th>
                    <th>Health Impact & Safety Guideline</th>
                  </tr>
                </thead>
                <tbody>
                  {HEAT_INDEX_THRESHOLDS.map((t) => (
                    <tr key={t.range}>
                      <td>
                        <strong>{t.range}</strong>
                      </td>
                      <td>
                        <span className={`badge ${t.tone}`}>{t.label}</span>
                      </td>
                      <td>{t.tone === 'ok' ? 'Normal' : '⚠️ Alert Active'}</td>
                      <td className="muted">{t.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Threshold Range</th>
                    <th>Classification</th>
                    <th>Alert Status</th>
                    <th>Health Impact & Safety Guideline</th>
                  </tr>
                </thead>
                <tbody>
                  {WIND_CHILL_THRESHOLDS.map((t) => (
                    <tr key={t.range}>
                      <td>
                        <strong>{t.range}</strong>
                      </td>
                      <td>
                        <span className={`badge ${t.tone}`}>{t.label}</span>
                      </td>
                      <td>⚠️ Cold Advisory</td>
                      <td className="muted">{t.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <TrendChart rows={recent} />

      <div className="panel">
        <h3 className="panel-title">Last 24 Hours</h3>
        {summary ? (
          <div className="summary-grid">
            <div>
              <span className="label">Readings</span>
              <strong>{summary.count.toLocaleString()}</strong>
            </div>
            <div>
              <span className="label">Avg Temp</span>
              <strong>{summary.avgTemp.toFixed(1)}°C</strong>
            </div>
            <div>
              <span className="label">Avg Humidity</span>
              <strong>{summary.avgHum.toFixed(1)}%</strong>
            </div>
            <div>
              <span className="label">Highest Rain</span>
              <strong>{summary.maxRain}%</strong>
            </div>
            <div>
              <span className="label">Rain Detected</span>
              <strong>{summary.rainyCount.toLocaleString()}×</strong>
            </div>
          </div>
        ) : (
          <p className="muted">No readings in the last 24 hours.</p>
        )}
      </div>

      <div className="section-head">
        <h3>Latest Readings</h3>
        <Link to="/admin/readings" className="btn-ghost btn-sm">
          View All
        </Link>
      </div>

      <ReadingsList
        rows={recent.slice(0, 10)}
        emptyText={loading ? 'Loading…' : 'No readings yet. Turn on the ESP32 device.'}
      />
    </>
  )
}
