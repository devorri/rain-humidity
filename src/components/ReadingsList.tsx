import { formatDateTime, rainStatus, type Reading } from '../lib/types'

type Props = {
  rows: Reading[]
  emptyText: string
  showId?: boolean
}

/** Table on desktop, stacked cards on phones. */
export default function ReadingsList({ rows, emptyText, showId }: Props) {
  return (
    <>
      <div className="table-wrap desktop-only">
        <table className="table">
          <thead>
            <tr>
              {showId && <th>#</th>}
              <th>Date & Time</th>
              <th>Rain</th>
              <th>Status</th>
              <th>Temperature</th>
              <th>Humidity</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={showId ? 6 : 5} className="empty">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const s = rainStatus(r.rain_percent)
                return (
                  <tr key={r.id}>
                    {showId && <td className="muted">{r.id}</td>}
                    <td>{formatDateTime(r.created_at)}</td>
                    <td>
                      <strong>{r.rain_percent}%</strong>
                    </td>
                    <td>
                      <span className={`badge ${s.tone}`}>{s.label}</span>
                    </td>
                    <td>{r.temperature.toFixed(1)}°C</td>
                    <td>{r.humidity.toFixed(1)}%</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="reading-cards mobile-only">
        {rows.length === 0 ? (
          <div className="reading-card empty">{emptyText}</div>
        ) : (
          rows.map((r) => {
            const s = rainStatus(r.rain_percent)
            return (
              <div className="reading-card" key={r.id}>
                <div className="reading-card-top">
                  <span className="reading-time">
                    {showId && <span className="muted">#{r.id} · </span>}
                    {formatDateTime(r.created_at)}
                  </span>
                  <span className={`badge ${s.tone}`}>{s.label}</span>
                </div>
                <div className="reading-card-values">
                  <div>
                    <span className="label">Rain</span>
                    <strong>{r.rain_percent}%</strong>
                  </div>
                  <div>
                    <span className="label">Temp</span>
                    <strong>{r.temperature.toFixed(1)}°C</strong>
                  </div>
                  <div>
                    <span className="label">Humidity</span>
                    <strong>{r.humidity.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
