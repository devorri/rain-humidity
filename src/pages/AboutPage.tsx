import { APP_NAME, APP_TAGLINE } from '../lib/types'

const components = [
  ['ESP32', 'Main microcontroller with built-in Wi-Fi. Reads the sensors and uploads the data.'],
  ['Rain Sensor Module', 'Detects water on the sensing pad. The analog value is converted into a 0–100% rain level.'],
  ['DHT11 Sensor', 'Measures air temperature (°C) and relative humidity (%).'],
  ['WiFiManager', 'Lets the device be connected to any Wi-Fi network through a setup portal (ESP32_Rain_Monitor).'],
  ['Supabase', 'Cloud database that stores every reading with its date and time.'],
  ['Web Dashboard', 'Admin-only page for monitoring the latest values and reading history.'],
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
          This system monitors rain, temperature and humidity using low-cost sensors connected to an ESP32. Readings are
          uploaded to a Supabase database every few seconds so the admin can check current conditions and past data from
          any device with a browser.
        </p>
      </section>

      <section className="glass-section">
        <h2>Objectives</h2>
        <ul className="plain-list">
          <li>Detect rain and show its level as a percentage.</li>
          <li>Measure temperature and humidity in real time.</li>
          <li>Store all readings in a cloud database with timestamps.</li>
          <li>Give the admin a simple dashboard to monitor the data.</li>
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
