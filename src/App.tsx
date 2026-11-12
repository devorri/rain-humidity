import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import './App.css'
import { AuthProvider, useAuth } from './lib/auth'
import PublicLayout from './components/PublicLayout'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import DevelopersPage from './pages/DevelopersPage'
import SignInPage from './pages/SignInPage'
import AdminLayout from './pages/admin/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import ReadingsPage from './pages/admin/ReadingsPage'

function RequireAdmin({ children }: { children: ReactNode }) {
  const { admin } = useAuth()
  if (!admin) return <Navigate to="/signin" replace />
  return <>{children}</>
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { admin } = useAuth()
  if (admin) return <Navigate to="/admin" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/developers" element={<DevelopersPage />} />
        </Route>

        <Route
          path="/signin"
          element={
            <GuestOnly>
              <SignInPage />
            </GuestOnly>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="readings" element={<ReadingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
