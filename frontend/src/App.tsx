import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { Navbar } from './components/Navbar'
import { Dashboard } from './pages/Dashboard'
import { DevicesPage } from './pages/DevicesPage'
import { TasksPage } from './pages/TasksPage'
import { EventsPage } from './pages/EventsPage'
import { LoginPage } from './pages/LoginPage'
import { SettingsPage } from './pages/SettingsPage'
import { LastUpdatedProvider } from './context/LastUpdatedContext'
import { isAuthenticated } from './services/auth'

function AppFooter() {
  return (
    <footer className="border-t border-[#2a3040] bg-[#1a1f2e] px-6 py-3 flex items-center justify-between text-xs text-gray-500">
      <span>Status is calculated based on the last event received for each task.</span>
      <div className="flex items-center gap-2">
        <Shield size={14} className="text-blue-400" />
        <span>Backup Manager v1.1.0</span>
      </div>
    </footer>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout>
          <Dashboard />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/devices',
    element: (
      <ProtectedRoute>
        <Layout>
          <DevicesPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/tasks',
    element: (
      <ProtectedRoute>
        <Layout>
          <TasksPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/events',
    element: (
      <ProtectedRoute>
        <Layout>
          <EventsPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <Layout>
          <SettingsPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
])

export default function App() {
  return (
    <LastUpdatedProvider>
      <RouterProvider router={router} />
    </LastUpdatedProvider>
  )
}
