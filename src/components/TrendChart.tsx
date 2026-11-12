import { useEffect, useRef, useState } from 'react'
import { formatTime, type Reading } from '../lib/types'

type Metric = 'rain_percent' | 'temperature' | 'humidity'

const METRICS: { key: Metric; label: string; unit: string; color: string }[] = [
  { key: 'rain_percent', label: 'Rain', unit: '%', color: '#0284c7' },
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#ea580c' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#16a34a' },
]

const H = 220
const PAD = { top: 16, right: 14, bottom: 26, left: 48 }

/** Simple line chart of the most recent readings (oldest on the left). */
export default function TrendChart({ rows }: { rows: Reading[] }) {
  const [metric, setMetric] = useState<Metric>('rain_percent')
  const boxRef = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(640)

  // draw at the real pixel width so text stays the same size on phone and desktop
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setW(Math.max(260, Math.round(entry.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const m = METRICS.find((x) => x.key === metric)!
  const data = [...rows].reverse()

  const values = data.map((r) => r[metric])
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (metric === 'rain_percent' || metric === 'humidity') {
    min = 0
    max = 100
  } else {
    min = Math.floor(min - 1)
    max = Math.ceil(max + 1)
  }
  const span = max - min || 1
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW)
  const y = (v: number) => PAD.top + innerH - ((v - min) / span) * innerH

  const line = data.map((r, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(r[metric]).toFixed(1)}`).join(' ')
  const area = data.length
    ? `${line} L${x(data.length - 1).toFixed(1)},${PAD.top + innerH} L${x(0).toFixed(1)},${PAD.top + innerH} Z`
    : ''
  const ticks = [0, 0.5, 1].map((t) => min + span * t)
  const last = data[data.length - 1]

  return (
    <div className="panel">
      <div className="chart-head">
        <h3>Recent Trend</h3>
        <div className="seg">
          {METRICS.map((x) => (
            <button
              key={x.key}
              type="button"
              className={metric === x.key ? 'active' : ''}
              onClick={() => setMetric(x.key)}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={boxRef}>
      {data.length < 2 ? (
        <p className="muted">Not enough readings yet to show a trend.</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="chart" role="img" aria-label={`${m.label} trend`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart-grid" />
                <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="chart-label">
                  {Math.round(t)}
                  {m.unit === '%' ? '%' : '°'}
                </text>
              </g>
            ))}
            <path d={area} fill={m.color} opacity={0.12} />
            <path d={line} fill="none" stroke={m.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={x(data.length - 1)} cy={y(last[metric])} r={4.5} fill={m.color} />
            <text x={PAD.left} y={H - 6} className="chart-label">
              {formatTime(data[0].created_at)}
            </text>
            <text x={W - PAD.right} y={H - 6} textAnchor="end" className="chart-label">
              {formatTime(last.created_at)}
            </text>
          </svg>
          <p className="chart-note muted">
            Last {data.length} readings · latest {m.label.toLowerCase()}:{' '}
            <strong>
              {metric === 'rain_percent' ? last[metric] : last[metric].toFixed(1)}
              {m.unit}
            </strong>
          </p>
        </>
      )}
      </div>
    </div>
  )
}
