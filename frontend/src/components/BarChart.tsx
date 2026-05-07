interface BarChartData {
  name: string
  healthy: number
  warning: number
  critical: number
}

interface BarChartProps {
  data: BarChartData[]
}

export function BarChart({ data }: BarChartProps) {
  return (
    <div className="bg-[#1a1f2e] border border-[#2a3040] rounded-xl p-5 flex flex-col gap-4">
      <h3 className="text-white text-sm font-semibold">Backups por dispositivo</h3>
      <div className="flex flex-col gap-3">
        {data.map((d) => {
          const rowTotal = d.healthy + d.warning + d.critical || 1
          return (
            <div key={d.name} className="flex items-center gap-3">
              <span className="text-gray-400 text-xs w-24 truncate shrink-0">{d.name}</span>
              <div className="flex-1 h-4 rounded-full overflow-hidden bg-[#2a3040] flex">
                {d.healthy > 0 && (
                  <div
                    className="bg-green-500 h-full transition-all"
                    style={{ width: `${(d.healthy / rowTotal) * 100}%` }}
                  />
                )}
                {d.warning > 0 && (
                  <div
                    className="bg-yellow-400 h-full transition-all"
                    style={{ width: `${(d.warning / rowTotal) * 100}%` }}
                  />
                )}
                {d.critical > 0 && (
                  <div
                    className="bg-red-500 h-full transition-all"
                    style={{ width: `${(d.critical / rowTotal) * 100}%` }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
          Saudáveis
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
          Atenção
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
          Críticos
        </span>
      </div>
    </div>
  )
}
