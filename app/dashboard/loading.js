export default function DashboardLoading() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#FAFAFA] sm:flex-row text-black">
      {/* Sidebar Skeleton (Desktop) */}
      <aside className="hidden h-full w-60 flex-col border-r border-zinc-200 bg-white py-6 px-4 sm:flex animate-pulse">
        {/* Brand Logo Skeleton */}
        <div className="mb-8 px-2">
          <div className="h-6 w-28 rounded-md bg-zinc-200" />
        </div>

        {/* Nav Items Skeleton */}
        <div className="flex flex-col gap-2 w-full">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-full rounded-xl bg-zinc-100" />
          ))}
        </div>

        {/* Bottom Profile Skeleton */}
        <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center gap-2.5 px-2">
          <div className="h-9 w-9 rounded-full bg-zinc-200" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-20 rounded bg-zinc-200" />
            <div className="h-2.5 w-14 rounded bg-zinc-100" />
          </div>
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-8 animate-pulse">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Header Bar Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-7 w-32 rounded-lg bg-zinc-200" />
              <div className="h-3.5 w-48 rounded bg-zinc-100" />
            </div>
            <div className="h-9 w-24 rounded-full bg-zinc-200" />
          </div>

          {/* Cards Stream Skeleton */}
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 w-full rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-zinc-100" />
                  <div className="space-y-2">
                    <div className="h-4 w-40 rounded bg-zinc-200" />
                    <div className="h-2.5 w-24 rounded bg-zinc-100" />
                  </div>
                </div>
                <div className="h-5 w-5 rounded bg-zinc-100" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
