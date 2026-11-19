import { useEffect, useRef, useState } from 'react'
import { calculateHeatIndex, formatTime, type Reading } from '../lib/types'

type Metric = 'rain_percent' | 'temperature' | 'humidity' | 'heat_index'

const METRICS: { key: Metric; label: string; unit: string; color: string }[] = [
  { key: 'rain_percent', label: 'Rain', unit: '%', color: '#0284c7' },
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#ea580c' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#16a34a' },
  { key: 'heat_index', label: 'Heat Index', unit: '°C', color: '#dc2626' },
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

  const getVal = (r: Reading): number => {
    if (metric === 'heat_index') {
      return calculateHeatIndex(r.temperature, r.humidity)
    }
    return r[metric]
  }

  const values = data.map(getVal)
  let min = values.length ? Math.min(...values) : 0
  let max = values.length ? Math.max(...values) : 100
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

  const line = data.map((r, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(getVal(r)).toFixed(1)}`).join(' ')
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

      <div className="chart-box" ref={boxRef}>
        {data.length < 2 ? (
          <div className="chart-empty">Waiting for more readings to draw a chart…</div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="chart-svg">
            <defs>
              <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={m.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={m.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {ticks.map((t) => {
              const yPos = y(t)
              return (
                <g key={t}>
                  <line x1={PAD.left} y1={yPos} x2={W - PAD.right} y2={yPos} stroke="#e5e7eb" strokeWidth="1" />
                  <text x={PAD.left - 8} y={yPos + 4} textAnchor="end" className="chart-tick">
                    {Math.round(t)}
                    {m.unit}
                  </text>
                </g>
              )
            })}

            <path d={area} fill={`url(#grad-${metric})`} />
            <path d={line} fill="none" stroke={m.color} strokeWidth="2.5" strokeLinejoin="round" />

            {last && (
              <circle
                cx={x(data.length - 1)}
                cy={y(getVal(last))}
                r="4.5"
                fill={m.color}
                stroke="#ffffff"
                strokeWidth="2"
              />
            )}

            {data.length > 0 && (
              <>
                <text x={PAD.left} y={H - 6} className="chart-time">
                  {formatTime(data[0].created_at)}
                </text>
                <text x={W - PAD.right} y={H - 6} textAnchor="end" className="chart-time">
                  {formatTime(data[data.length - 1].created_at)}
                </text>
              </>
            )}
          </svg>
        )}
      </div>
    </div>
  )
}
