import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Dashboard } from './pages/Dashboard'
import { DevicesPage } from './pages/DevicesPage'
import { TasksPage } from './pages/TasksPage'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <main>{children}</main>
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
  return <RouterProvider router={router} />
}
