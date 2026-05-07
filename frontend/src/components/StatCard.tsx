import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  sub: string
  iconColor?: string
  iconBg?: string
}

export function StatCard({ icon: Icon, label, value, sub, iconColor = 'text-blue-400', iconBg = 'bg-blue-500/10' }: StatCardProps) {
  return (
    <div className="bg-[#1a1f2e] border border-[#2a3040] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs font-medium">{label}</span>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
      </div>
      <div>
        <div className="text-white text-2xl font-bold">{value}</div>
        <div className="text-gray-500 text-xs mt-0.5">{sub}</div>
      </div>
    </div>
  )
}
