import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { APP_NAME, APP_TAGLINE, BRAND_A, BRAND_B, LOGO_SRC } from '../lib/types'
import { useAuth } from '../lib/auth'

export default function PublicLayout() {
  const [open, setOpen] = useState(false)
  const { admin } = useAuth()
  const close = () => setOpen(false)
  const navClass = ({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`

  return (
    <div className="public-shell">
      <header className="top-nav">
        <Link to="/" className="brand" onClick={close}>
          <img src={LOGO_SRC} alt={APP_NAME} className="brand-logo" />
          <span className="brand-text">
            {BRAND_A}
            <span>{BRAND_B}</span>
          </span>
        </Link>

        <button
          type="button"
          className="hamburger-btn"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" end className={navClass} onClick={close}>
            Home
          </NavLink>
          <NavLink to="/about" className={navClass} onClick={close}>
            About
          </NavLink>
          <NavLink to="/developers" className={navClass} onClick={close}>
            Developers
          </NavLink>
          <Link to={admin ? '/admin' : '/signin'} className="btn btn-sm" onClick={close}>
            {admin ? 'Dashboard' : 'Sign In'}
          </Link>
        </nav>
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        © {new Date().getFullYear()} {APP_NAME} — {APP_TAGLINE}
      </footer>
    </div>
  )
}
