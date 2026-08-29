export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse text-white">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-lg bg-zinc-850" />
          <div className="h-3.5 w-72 rounded bg-zinc-900" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-zinc-850" />
      </div>

      {/* 6-Grid Metric Cards Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 pt-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-zinc-850 bg-zinc-950 p-4 shadow-sm flex flex-col justify-between">
            <div className="h-3 w-16 rounded bg-zinc-850" />
            <div className="h-7 w-12 rounded bg-zinc-800" />
          </div>
        ))}
      </div>

      {/* Large Content Panels Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        <div className="lg:col-span-8 h-80 rounded-3xl border border-zinc-850 bg-zinc-950 p-6 shadow-sm flex flex-col justify-between">
          <div className="h-5 w-44 rounded bg-zinc-850" />
          <div className="h-52 w-full rounded-2xl bg-zinc-900" />
        </div>
        <div className="lg:col-span-4 h-80 rounded-3xl border border-zinc-850 bg-zinc-950 p-6 shadow-sm flex flex-col justify-between">
          <div className="h-5 w-32 rounded bg-zinc-850" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 w-full rounded-xl bg-zinc-900" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
