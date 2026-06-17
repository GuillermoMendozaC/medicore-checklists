import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'

// Import Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CategoryList from './pages/CategoryList'
import EquipmentList from './pages/EquipmentList'
import TemplateList from './pages/TemplateList'
import ChecklistFill from './pages/ChecklistFill'
import ChecklistHistory from './pages/ChecklistHistory'

// Client Portal Pages
import ClientEquipmentList from './pages/client/ClientEquipmentList'
import ClientEquipmentHistory from './pages/client/ClientEquipmentHistory'
import ClientAppointmentForm from './pages/client/ClientAppointmentForm'
import ClientAppointmentList from './pages/client/ClientAppointmentList'

// Admin Administration Pages
import AppointmentRequests from './pages/admin/AppointmentRequests'
import ClientList from './pages/admin/ClientList'
import UserRoles from './pages/admin/UserRoles'

function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 relative">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Admin & Técnico Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['admin', 'tecnico']}>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/categories"
            element={
              <ProtectedRoute adminOnly>
                <AppLayout>
                  <CategoryList />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/equipment"
            element={
              <ProtectedRoute allowedRoles={['admin', 'tecnico']}>
                <AppLayout>
                  <EquipmentList />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/templates"
            element={
              <ProtectedRoute adminOnly>
                <AppLayout>
                  <TemplateList />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/fill"
            element={
              <ProtectedRoute allowedRoles={['admin', 'tecnico']}>
                <AppLayout>
                  <ChecklistFill />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedRoute allowedRoles={['admin', 'tecnico']}>
                <AppLayout>
                  <ChecklistHistory />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Client Portal Routes */}
          <Route
            path="/portal/equipos"
            element={
              <ProtectedRoute allowedRoles={['cliente']}>
                <AppLayout>
                  <ClientEquipmentList />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/equipos/:id/historial"
            element={
              <ProtectedRoute allowedRoles={['cliente']}>
                <AppLayout>
                  <ClientEquipmentHistory />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/citas"
            element={
              <ProtectedRoute allowedRoles={['cliente']}>
                <AppLayout>
                  <ClientAppointmentList />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/citas/nueva"
            element={
              <ProtectedRoute allowedRoles={['cliente']}>
                <AppLayout>
                  <ClientAppointmentForm />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Management Routes */}
          <Route
            path="/admin/citas"
            element={
              <ProtectedRoute adminOnly>
                <AppLayout>
                  <AppointmentRequests />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/clientes"
            element={
              <ProtectedRoute adminOnly>
                <AppLayout>
                  <ClientList />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute adminOnly>
                <AppLayout>
                  <UserRoles />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
