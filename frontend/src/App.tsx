import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { Navbar } from './components/Navbar'
import { Dashboard } from './pages/Dashboard'
import { DevicesPage } from './pages/DevicesPage'
import { TasksPage } from './pages/TasksPage'
import { LastUpdatedProvider } from './context/LastUpdatedContext'

function AppFooter() {
  return (
    <footer className="border-t border-[#2a3040] bg-[#1a1f2e] px-6 py-3 flex items-center justify-between text-xs text-gray-500">
      <span>Status is calculated based on the last event received for each task.</span>
      <div className="flex items-center gap-2">
        <Shield size={14} className="text-blue-400" />
        <span>Backup Manager v0.1.0</span>
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

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <Dashboard />
      </Layout>
    ),
  },
  {
    path: '/devices',
    element: (
      <Layout>
        <DevicesPage />
      </Layout>
    ),
  },
  {
    path: '/tasks',
    element: (
      <Layout>
        <TasksPage />
      </Layout>
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
