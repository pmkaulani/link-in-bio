export default function PublicProfileLoading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black px-4 py-16 text-white">
      <div className="w-full max-w-[440px] flex flex-col items-center gap-6 animate-pulse">
        {/* Top Header Logo Skeleton */}
        <div className="flex w-full items-center justify-between px-2 mb-2">
          <div className="h-5 w-24 rounded-md bg-zinc-850" />
          <div className="h-8 w-8 rounded-full bg-zinc-850" />
        </div>

        {/* Avatar Skeleton */}
        <div className="h-24 w-24 rounded-full bg-zinc-800 border-2 border-zinc-700 shadow-xl" />

        {/* Name & Bio Skeleton */}
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="h-6 w-36 rounded-lg bg-zinc-800" />
          <div className="h-4 w-24 rounded-md bg-zinc-850" />
          <div className="h-3 w-64 rounded-md bg-zinc-900 mt-1" />
        </div>

        {/* Social Icons Row Skeleton */}
        <div className="flex items-center gap-3 mt-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-10 rounded-full bg-zinc-850 border border-zinc-800" />
          ))}
        </div>

        {/* Link Cards Skeleton */}
        <div className="flex w-full flex-col gap-3 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 w-full rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between px-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-800" />
                <div className="space-y-1.5">
                  <div className="h-3 w-32 rounded-sm bg-zinc-800" />
                  <div className="h-2 w-20 rounded-sm bg-zinc-850" />
                </div>
              </div>
              <div className="h-4 w-4 rounded bg-zinc-800" />
            </div>
          ))}
        </div>

        {/* Footer Pill Skeleton */}
        <div className="h-8 w-44 rounded-full bg-zinc-900 border border-zinc-800 mt-4" />
      </div>
    </main>
  );
}
