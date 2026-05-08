import { useEffect, useState } from 'react'
import { X, Copy, Check } from 'lucide-react'
import type { Task } from '../types'

const ENDPOINT = `${import.meta.env.VITE_API_BASE_URL ?? ''}/webhooks/sync`

function buildPayload(task: Task) {
  return {
    api_key: 'YOUR_API_KEY',
    device_id: task.device_id,
    source: 'your-source',
    task: task.task,
    status: 'success',
  }
}

function highlight(json: string) {
  return json.replace(
    /("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|(\btrue\b|\bfalse\b|\bnull\b)|(\b\d+\.?\d*\b)/g,
    (_, key, str, bool, num) => {
      if (key) return `<span class="text-blue-300">${key}</span>:`
      if (str) return `<span class="text-green-300">${str}</span>`
      if (bool) return `<span class="text-yellow-300">${bool}</span>`
      if (num) return `<span class="text-orange-300">${num}</span>`
      return _
    }
  )
}

interface Props {
  task: Task
  onClose: () => void
}

export function WebhookModal({ task, onClose }: Props) {
  const [copied, setCopied] = useState<'endpoint' | 'payload' | null>(null)

  const payload = buildPayload(task)
  const payloadStr = JSON.stringify(payload, null, 2)

  const copy = (text: string, key: 'endpoint' | 'payload') => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1f2e] border border-[#2a3040] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col gap-5 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-base">Webhook Payload</h2>
            <p className="text-gray-500 text-xs mt-0.5 font-mono">{task.device_id} / {task.task}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Endpoint */}
        <div className="flex flex-col gap-1.5">
          <span className="text-gray-400 text-xs uppercase tracking-wide">Endpoint</span>
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
            <span className="text-gray-300 text-xs font-mono flex-1 truncate">{ENDPOINT}</span>
            <button
              onClick={() => copy(ENDPOINT, 'endpoint')}
              className="text-gray-500 hover:text-gray-300 transition-colors shrink-0"
            >
              {copied === 'endpoint' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Payload */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs uppercase tracking-wide">JSON Body</span>
            <button
              onClick={() => copy(payloadStr, 'payload')}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              {copied === 'payload'
                ? <><Check size={12} className="text-green-400" /><span className="text-green-400">Copied!</span></>
                : <><Copy size={12} /><span>Copy</span></>
              }
            </button>
          </div>
          <pre
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-xs font-mono leading-relaxed overflow-auto"
            dangerouslySetInnerHTML={{ __html: highlight(payloadStr) }}
          />
        </div>

        <p className="text-gray-600 text-xs">
          Replace <span className="text-gray-400 font-mono">YOUR_API_KEY</span> with the key configured on the server and <span className="text-gray-400 font-mono">your-source</span> with your sync app identifier.
        </p>
      </div>
    </div>
  )
}
