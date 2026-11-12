import { Link } from 'react-router-dom'
import { CloudRain, Droplets, Thermometer, Wifi, Database, LayoutDashboard } from 'lucide-react'
import { APP_NAME, APP_TAGLINE, LOGO_SRC } from '../lib/types'

const features = [
  {
    icon: <CloudRain size={22} />,
    title: 'Rain Level (%)',
    text: 'A rain sensor reads how wet the surface is and converts it to a 0–100% rain level.',
  },
  {
    icon: <Thermometer size={22} />,
    title: 'Temperature',
    text: 'A DHT11 sensor measures the surrounding air temperature in °C.',
  },
  {
    icon: <Droplets size={22} />,
    title: 'Humidity',
    text: 'The same DHT11 sensor tracks relative humidity so you know how moist the air is.',
  },
]

const steps = [
  { icon: <Wifi size={20} />, title: 'ESP32 reads sensors', text: 'Every 5 seconds the device reads rain, temperature and humidity.' },
  { icon: <Database size={20} />, title: 'Saved to Supabase', text: 'Readings are sent over Wi-Fi and stored in the cloud database.' },
  { icon: <LayoutDashboard size={20} />, title: 'Admin monitors', text: 'The admin signs in to view live values and reading history.' },
]

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <img src={LOGO_SRC} alt={APP_NAME} className="hero-logo" />
        <span className="eyebrow">{APP_NAME} Project</span>
        <h1>{APP_TAGLINE}</h1>
        <p className="lede">
          Real-time rain level, temperature and humidity readings from an ESP32 sensor station, saved to the cloud and
          monitored from a simple admin dashboard.
        </p>
        <div className="hero-actions">
          <Link to="/signin" className="btn">
            Admin Sign In
          </Link>
          <Link to="/about" className="btn-ghost">
            Learn More
          </Link>
        </div>
      </section>

      <section className="glass-section">
        <h2>What it monitors</h2>
        <div className="feature-grid">
          {features.map((f) => (
            <div className="feature" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-section">
        <h2>How it works</h2>
        <div className="feature-grid">
          {steps.map((s, i) => (
            <div className="feature" key={s.title}>
              <div className="feature-icon">{s.icon}</div>
              <h3>
                {i + 1}. {s.title}
              </h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
