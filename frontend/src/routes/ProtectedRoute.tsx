import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../state/AuthContext'

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
