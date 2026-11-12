import { useCallback, useEffect, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { supabase, READINGS_TABLE, friendlyError } from '../../lib/supabase'
import ReadingsList from '../../components/ReadingsList'
import { formatDateTime, normalizeReading, rainStatus, type Reading } from '../../lib/types'

const PAGE_SIZE = 20

/** yyyy-mm-dd (Philippine date) -> ISO start/end of that day in UTC */
function dayStartIso(d: string) {
  return new Date(`${d}T00:00:00+08:00`).toISOString()
}
function dayEndIso(d: string) {
  return new Date(`${d}T23:59:59.999+08:00`).toISOString()
}

type RainFilter = 'all' | 'rain' | 'dry'

export default function ReadingsPage() {
  const [rows, setRows] = useState<Reading[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [rain, setRain] = useState<RainFilter>('all')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildQuery = useCallback(
    (select: string, withCount: boolean) => {
      let q = supabase
        .from(READINGS_TABLE)
        .select(select, withCount ? { count: 'exact' } : undefined)
        .order('created_at', { ascending: false })
      if (from) q = q.gte('created_at', dayStartIso(from))
      if (to) q = q.lte('created_at', dayEndIso(to))
      if (rain === 'rain') q = q.gt('rain_percent', 10)
      if (rain === 'dry') q = q.lte('rain_percent', 10)
      return q
    },
    [from, to, rain],
  )

  const load = useCallback(async () => {
    setLoading(true)
    const start = (page - 1) * PAGE_SIZE
    const { data, count, error } = await buildQuery('*', true).range(start, start + PAGE_SIZE - 1)
    if (error) {
      setError(friendlyError(error))
    } else {
      setError(null)
      setRows((data as unknown as Reading[]).map(normalizeReading))
      setTotal(count ?? 0)
    }
    setLoading(false)
  }, [buildQuery, page])

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(t)
  }, [load])

  // filters always go back to page 1
  function changeFrom(v: string) {
    setFrom(v)
    setPage(1)
  }
  function changeTo(v: string) {
    setTo(v)
    setPage(1)
  }
  function changeRain(v: RainFilter) {
    setRain(v)
    setPage(1)
  }

  async function exportCsv() {
    setExporting(true)
    const all: Reading[] = []
    const chunk = 1000
    for (let start = 0; ; start += chunk) {
      const { data, error } = await buildQuery('*', false).range(start, start + chunk - 1)
      if (error) {
        setError(friendlyError(error))
        break
      }
      const list = (data as unknown as Reading[]).map(normalizeReading)
      all.push(...list)
      if (list.length < chunk || all.length >= 50000) break
    }
    const header = 'ID,Date & Time,Rain (%),Rain Status,Temperature (C),Humidity (%)'
    const lines = all.map((r) =>
      [
        r.id,
        `"${formatDateTime(r.created_at)}"`,
        r.rain_percent,
        rainStatus(r.rain_percent).label,
        r.temperature.toFixed(2),
        r.humidity.toFixed(2),
      ].join(','),
    )
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `sensor-readings-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    setExporting(false)
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasFilters = from || to || rain !== 'all'

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Sensor Readings</h1>
          <p className="lede">Full history of every reading sent by the device.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-ghost btn-sm" onClick={() => void load()}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button type="button" className="btn btn-sm" onClick={() => void exportCsv()} disabled={exporting || total === 0}>
            <Download size={15} /> {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="field">
          <label htmlFor="from">From</label>
          <input id="from" type="date" className="input" value={from} onChange={(e) => changeFrom(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="to">To</label>
          <input id="to" type="date" className="input" value={to} onChange={(e) => changeTo(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="rain">Rain</label>
          <select id="rain" className="input" value={rain} onChange={(e) => changeRain(e.target.value as RainFilter)}>
            <option value="all">All readings</option>
            <option value="rain">With rain (&gt; 10%)</option>
            <option value="dry">No rain (≤ 10%)</option>
          </select>
        </div>
        {hasFilters && (
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => {
              setFrom('')
              setTo('')
              setRain('all')
              setPage(1)
            }}
          >
            Clear
          </button>
        )}
      </div>

      {error && <div className="alert bad">{error}</div>}

      <ReadingsList rows={rows} showId emptyText={loading ? 'Loading…' : 'No readings found.'} />

      <div className="table-pagination">
        <span className="muted">
          {total === 0
            ? '0 readings'
            : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total.toLocaleString()}`}
        </span>
        <div>
          <button type="button" className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Prev
          </button>
          <span className="page-num">
            Page {page} of {pages}
          </span>
          <button type="button" className="btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      </div>
    </>
  )
}
