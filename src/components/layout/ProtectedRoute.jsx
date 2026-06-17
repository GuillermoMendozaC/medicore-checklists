import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles = null, adminOnly = false }) {
  const { isLoggedIn, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Cargando sesión de MediCore...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  const role = profile?.role

  // Handle legacy adminOnly flag
  if (adminOnly && role !== 'admin') {
    if (role === 'cliente') {
      return <Navigate to="/portal/equipos" replace />
    }
    return <Navigate to="/" replace />
  }

  // Handle allowedRoles check
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'cliente') {
      return <Navigate to="/portal/equipos" replace />
    }
    return <Navigate to="/" replace />
  }

  return children
}
