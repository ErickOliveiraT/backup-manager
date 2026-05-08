function SkeletonBlock({ className }: { className: string }) {
  return <div className={`bg-gray-700/60 rounded animate-pulse ${className}`} />
}

export function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-700">
      <div className="bg-gray-800 px-4 py-3 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} className="h-3 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`px-4 py-3.5 flex gap-6 ${i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/50'}`}>
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonBlock key={j} className={`h-3 ${j === 0 ? 'w-28' : j === cols - 1 ? 'w-12' : 'w-20'}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function StatusCardSkeleton() {
  return (
    <div className="bg-[#1a1f2e] border border-[#2a3040] rounded-xl p-5 flex flex-col gap-3 min-h-[160px] animate-pulse">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </div>
      <SkeletonBlock className="h-3 w-32 mt-1" />
      <div className="mt-auto flex items-center justify-between">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-3 w-12" />
      </div>
    </div>
  )
}
