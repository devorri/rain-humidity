import { APP_NAME, APP_TAGLINE, HEAT_INDEX_THRESHOLDS, WIND_CHILL_THRESHOLDS } from '../lib/types'

const components = [
  ['ESP32', 'Main microcontroller with built-in Wi-Fi. Reads the sensors and uploads the data.'],
  ['Rain Sensor Module', 'Detects water on the sensing pad. The analog value is converted into a 0–100% rain level.'],
  ['DHT11 Sensor', 'Measures air temperature (°C) and relative humidity (%).'],
  ['WiFiManager', 'Lets the device be connected to any Wi-Fi network through a setup portal (ESP32_Rain_Monitor).'],
  ['Supabase', 'Cloud database that stores every reading with its date and time.'],
  ['Web Dashboard', 'Admin portal with live monitoring, automated thermal alerts, and reading history.'],
]

const rainLevels = [
  ['0 – 10%', 'No Rain', 'ok'],
  ['11 – 40%', 'Light Rain', 'info'],
  ['41 – 70%', 'Moderate Rain', 'warn'],
  ['71 – 100%', 'Heavy Rain', 'bad'],
]

export default function AboutPage() {
  return (
    <>
      <section className="glass-section page-intro">
        <span className="eyebrow dark">About the Project</span>
        <h1>{APP_NAME}</h1>
        <p className="subtitle">{APP_TAGLINE}</p>
        <p className="lede">
          This system monitors rain, temperature and humidity using sensors connected to an ESP32. Readings are
          uploaded to a Supabase database in real-time, calculating Heat Index and Wind Chill safety alerts to protect
          individuals from extreme weather conditions.
        </p>
      </section>

      <section className="glass-section">
        <h2>Objectives</h2>
        <ul className="plain-list">
          <li>Detect rain and show its level as an intuitive percentage.</li>
          <li>Measure ambient temperature and relative humidity in real time.</li>
          <li>Compute Heat Index and monitor Wind Chill temperature thresholds.</li>
          <li>Provide instant audio and desktop notifications when hazardous thresholds are crossed.</li>
          <li>Store historical readings in the cloud for export and analysis.</li>
        </ul>
      </section>

      <section className="glass-section">
        <h2>System Components</h2>
        <div className="feature-grid">
          {components.map(([name, desc]) => (
            <div className="feature" key={name}>
              <h3>{name}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-section">
        <h2>Heat Index Thresholds</h2>
        <p className="muted" style={{ marginBottom: '1rem' }}>
          Apparent temperature calculated from ambient air temperature and relative humidity.
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Heat Index Range</th>
                <th>Classification</th>
                <th>Health Impact & Safety Recommendation</th>
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
                  <td className="muted">{t.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-section">
        <h2>Wind Chill Temperature Thresholds</h2>
        <p className="muted" style={{ marginBottom: '1rem' }}>
          Cold risk scale based on cooling effects on exposed skin.
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Temperature Range</th>
                <th>Risk Classification</th>
                <th>Health Impact & Safety Recommendation</th>
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
                  <td className="muted">{t.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-section">
        <h2>Institutional Affiliation</h2>
        <div className="affiliation-banner">
          <div className="affiliation-item">
            <img src="/school-logo.png" alt="School Logo" className="affiliation-logo" />
            <div>
              <h3>Senior High School</h3>
              <p className="muted">Academic Institution & Research Department</p>
            </div>
          </div>
          <div className="affiliation-item">
            <img src="/strand-logo.png" alt="Strand Logo" className="affiliation-logo" />
            <div>
              <h3>Specialized Track & Strand</h3>
              <p className="muted">Technical-Vocational / STEM Innovation Project</p>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-section">
        <h2>Rain Level Guide</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Rain %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rainLevels.map(([range, label, tone]) => (
                <tr key={range}>
                  <td>{range}</td>
                  <td>
                    <span className={`badge ${tone}`}>{label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
