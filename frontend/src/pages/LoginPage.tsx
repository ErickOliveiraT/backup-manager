import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { login } from '../services/api'
import { setToken } from '../services/auth'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token } = await login(username, password)
      setToken(token)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="bg-blue-500/10 p-3 rounded-xl">
            <Shield size={28} className="text-blue-400" />
          </div>
          <h1 className="text-white text-xl font-bold tracking-tight">Backup Manager</h1>
          <p className="text-gray-500 text-sm">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1a1f2e] border border-[#2a3040] rounded-xl p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-400 text-xs">Username</label>
            <input
              type="text"
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-gray-900 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-gray-400 text-xs">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-gray-900 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md px-4 py-2 transition-colors mt-1"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
