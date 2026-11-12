import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, LayoutDashboard, LogOut, Menu, Table2, X } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { APP_NAME, BRAND_A, BRAND_B, LOGO_SRC } from '../../lib/types'

const titles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/readings': 'Sensor Readings',
}

export default function AdminLayout() {
  const { admin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [confirmOut, setConfirmOut] = useState(false)
  const { pathname } = useLocation()
  const close = () => setOpen(false)
  const navClass = ({ isActive }: { isActive: boolean }) => `admin-nav-item ${isActive ? 'active' : ''}`

  const brand = (
    <>
      <img src={LOGO_SRC} alt={APP_NAME} className="brand-logo" />
      <span className="brand-text">
        {BRAND_A}
        <span>{BRAND_B}</span>
      </span>
    </>
  )

  return (
    <div className="admin-shell">
      <header className="admin-mobile-header">
        <button type="button" className="hamburger-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="admin-sidebar-brand" style={{ margin: 0, padding: 0 }}>
          {brand}
        </div>
        <span className="badge info">Admin</span>
      </header>

      {open && <div className="admin-sidebar-overlay" onClick={close} />}

      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <Link to="/admin" className="admin-sidebar-brand" onClick={close}>
          {brand}
        </Link>

        <div className="admin-nav-group">
          <div className="admin-nav-label">Monitoring</div>
          <NavLink to="/admin" end className={navClass} onClick={close}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/readings" className={navClass} onClick={close}>
            <Table2 size={18} />
            <span>Sensor Readings</span>
          </NavLink>

          <div className="admin-nav-label" style={{ marginTop: '1rem' }}>
            Website
          </div>
          <NavLink to="/" end className={navClass} onClick={close}>
            <Home size={18} />
            <span>View Website</span>
          </NavLink>
        </div>

        <div className="admin-user-card">
          <div className="admin-user-info">
            <strong>{admin?.username}</strong>
            <span>Administrator</span>
          </div>
          <button type="button" className="btn-ghost btn-block" onClick={() => setConfirmOut(true)}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <span className="admin-topbar-title">Admin Portal</span>
            <span className="admin-topbar-sub">/ {titles[pathname] ?? 'Dashboard'}</span>
          </div>
          <span className="admin-topbar-sub">Signed in as {admin?.username}</span>
        </div>
        <Outlet />
      </main>

      {confirmOut && (
        <div className="modal-backdrop" onClick={() => setConfirmOut(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Sign out?</h3>
            <p className="muted">You will need to sign in again to view the dashboard.</p>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setConfirmOut(false)}>
                Cancel
              </button>
              <button type="button" className="btn" onClick={logout}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
