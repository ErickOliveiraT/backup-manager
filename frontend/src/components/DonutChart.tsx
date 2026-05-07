interface DonutChartProps {
  healthy: number
  warning: number
  critical: number
}

const R = 60
const CX = 80
const CY = 80
const C = 2 * Math.PI * R

function seg(value: number, total: number): number {
  if (total === 0) return 0
  return (value / total) * C
}

export function DonutChart({ healthy, warning, critical }: DonutChartProps) {
  const total = healthy + warning + critical
  const hDash = seg(healthy, total)
  const wDash = seg(warning, total)
  const cDash = seg(critical, total)

  const hPct = total ? Math.round((healthy / total) * 100) : 0
  const wPct = total ? Math.round((warning / total) * 100) : 0
  const cPct = total ? Math.round((critical / total) * 100) : 0

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3040] rounded-xl p-5 flex flex-col gap-4">
      <h3 className="text-white text-sm font-semibold">Distribuição de status</h3>
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <svg viewBox="0 0 160 160" className="w-36 h-36">
            {/* Track */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#2a3040" strokeWidth={20} />
            {total === 0 ? null : (
              <>
                {/* Healthy (green) */}
                <circle
                  cx={CX} cy={CY} r={R}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth={20}
                  strokeDasharray={`${hDash} ${C}`}
                  strokeDashoffset={0}
                  transform={`rotate(-90 ${CX} ${CY})`}
                />
                {/* Warning (yellow) */}
                <circle
                  cx={CX} cy={CY} r={R}
                  fill="none"
                  stroke="#eab308"
                  strokeWidth={20}
                  strokeDasharray={`${wDash} ${C}`}
                  strokeDashoffset={C - hDash}
                  transform={`rotate(-90 ${CX} ${CY})`}
                />
                {/* Critical (red) */}
                <circle
                  cx={CX} cy={CY} r={R}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={20}
                  strokeDasharray={`${cDash} ${C}`}
                  strokeDashoffset={C - hDash - wDash}
                  transform={`rotate(-90 ${CX} ${CY})`}
                />
              </>
            )}
            <text x={CX} y={CY - 6} textAnchor="middle" fill="white" fontSize={22} fontWeight="bold">{total}</text>
            <text x={CX} y={CY + 12} textAnchor="middle" fill="#6b7280" fontSize={11}>Total</text>
          </svg>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
            <span className="text-gray-400 text-xs">Saudáveis</span>
            <span className="ml-auto text-white font-medium text-xs">{healthy}</span>
            <span className="text-gray-600 text-xs w-10 text-right">({hPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
            <span className="text-gray-400 text-xs">Atenção</span>
            <span className="ml-auto text-white font-medium text-xs">{warning}</span>
            <span className="text-gray-600 text-xs w-10 text-right">({wPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
            <span className="text-gray-400 text-xs">Críticos</span>
            <span className="ml-auto text-white font-medium text-xs">{critical}</span>
            <span className="text-gray-600 text-xs w-10 text-right">({cPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
