import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CloudRain, Droplets, Thermometer, Clock, RefreshCw } from 'lucide-react'
import { supabase, READINGS_TABLE, friendlyError } from '../../lib/supabase'
import { formatTime, normalizeReading, ONLINE_WINDOW_MS, rainStatus, timeAgo, type Reading } from '../../lib/types'
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
      setRecent((recentRes.data as Reading[]).map(normalizeReading))
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

  const now = recent[0]
  const online = now ? nowMs - new Date(now.created_at).getTime() < ONLINE_WINDOW_MS : false
  const status = now ? rainStatus(now.rain_percent) : null
  const dash = loading ? '—' : 'No data'

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="lede">Live readings from the sensor. Updates every 5 seconds.</p>
        </div>
        <div className="header-actions">
          <span className={`badge ${online ? 'ok' : 'bad'}`}>
            <span className={`dot ${online ? 'on' : ''}`} /> Device {online ? 'Online' : 'Offline'}
          </span>
          <button type="button" className="btn-ghost btn-sm" onClick={() => void load()}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert bad">{error}</div>}

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
            <span className="label">Last Update</span>
            <Clock size={20} className="stat-icon" />
          </div>
          <div className="value value-sm">{now ? formatTime(now.created_at) : dash}</div>
          {now && <span className="stat-sub">{timeAgo(now.created_at, nowMs)}</span>}
        </div>
      </div>

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
