import { useEffect, useState } from 'react'
import { Key, Eye, EyeOff, Copy, RefreshCw, Check, Lock } from 'lucide-react'
import { fetchMe, regenerateApiKey, changePassword } from '../services/api'
import type { User } from '../types'

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-gray-400 text-xs">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full bg-gray-900 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // API key state
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [confirmRegen, setConfirmRegen] = useState(false)
  const [regenError, setRegenError] = useState('')

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => setLoadError('Failed to load user data'))
      .finally(() => setLoading(false))
  }, [])

  const handleCopy = () => {
    if (!user) return
    navigator.clipboard.writeText(user.api_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = async () => {
    if (!confirmRegen) {
      setConfirmRegen(true)
      return
    }
    setRegenerating(true)
    setConfirmRegen(false)
    setRegenError('')
    try {
      const { api_key } = await regenerateApiKey()
      setUser((u) => u ? { ...u, api_key } : u)
      setShowKey(true)
    } catch {
      setRegenError('Failed to regenerate API key')
    } finally {
      setRegenerating(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setPasswordSaving(false)
    }
  }

  const maskedKey = user ? '•'.repeat(24) + user.api_key.slice(-8) : ''

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-white text-xl font-bold">Settings</h1>

      {loading && <p className="text-gray-400 text-sm">Loading…</p>}
      {loadError && <p className="text-red-400 text-sm">{loadError}</p>}

      {user && (
        <>
          {/* Profile + API Key */}
          <div className="bg-[#1a1f2e] border border-[#2a3040] rounded-xl divide-y divide-[#2a3040]">
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-gray-400 text-sm">Name</span>
              <span className="text-gray-200 text-sm">{user.name}</span>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-gray-400 text-sm">Username</span>
              <span className="text-gray-200 text-sm font-mono">{user.username}</span>
            </div>

            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-3">
                <Key size={14} className="text-blue-400" />
                <span className="text-gray-400 text-sm">API Key</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-2 font-mono text-sm text-gray-300 truncate">
                  {showKey ? user.api_key : maskedKey}
                </div>
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="p-2 text-gray-500 hover:text-gray-300 transition-colors"
                  title={showKey ? 'Hide' : 'Show'}
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  onClick={handleCopy}
                  className="p-2 text-gray-500 hover:text-gray-300 transition-colors"
                  title="Copy"
                >
                  {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                {confirmRegen ? (
                  <>
                    <span className="text-yellow-400 text-xs">This will invalidate the current key. Confirm?</span>
                    <button
                      onClick={handleRegenerate}
                      disabled={regenerating}
                      className="text-xs bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-md transition-colors"
                    >
                      Yes, regenerate
                    </button>
                    <button
                      onClick={() => setConfirmRegen(false)}
                      className="text-xs text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw size={13} className={regenerating ? 'animate-spin' : ''} />
                    Regenerate API key
                  </button>
                )}
              </div>
              {regenError && <p className="text-red-400 text-xs mt-2">{regenError}</p>}
            </div>
          </div>

          {/* Change password */}
          <div className="bg-[#1a1f2e] border border-[#2a3040] rounded-xl">
            <div className="px-6 py-4 flex items-center gap-2 border-b border-[#2a3040]">
              <Lock size={14} className="text-blue-400" />
              <span className="text-gray-300 text-sm font-medium">Change password</span>
            </div>
            <form onSubmit={handlePasswordChange} className="px-6 py-5 flex flex-col gap-4">
              <PasswordField
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
              />
              <PasswordField
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
              />
              <PasswordField
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
              />

              {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
              {passwordSuccess && <p className="text-green-400 text-xs">Password changed successfully.</p>}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md px-4 py-2 transition-colors"
                >
                  {passwordSaving ? 'Saving…' : 'Change password'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
