const block = "animate-pulse rounded-lg bg-white/[0.05]";

export function CardSkeleton() {
  return (
    <div className="flex h-[248px] flex-col rounded-2xl border border-line bg-surface p-4">
      <div className="flex gap-3">
        <div className={`${block} h-11 w-11 rounded-xl`} />
        <div className="flex-1 space-y-2 pt-1">
          <div className={`${block} h-3 w-1/2`} />
          <div className={`${block} h-2.5 w-1/3`} />
        </div>
      </div>
      <div className={`${block} mt-4 h-4 w-4/5`} />
      <div className={`${block} mt-2 h-4 w-3/5`} />
      <div className={`${block} mt-4 h-3 w-2/5`} />
      <div className={`${block} mt-2 h-3 w-1/2`} />
      <div className="mt-auto flex gap-2">
        <div className={`${block} h-5 w-24 rounded-full`} />
        <div className={`${block} h-5 w-14 rounded-full`} />
      </div>
    </div>
  );
}

export function GridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Placeholder for the whole Browse page while listings load. */
export function BrowseSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-busy="true" aria-label="Loading hackathons">
      <div className="h-[220px] rounded-3xl border border-line bg-surface/70 p-8 sm:h-[260px]">
        <div className={`${block} h-6 w-48 rounded-full`} />
        <div className={`${block} mt-5 h-10 w-full max-w-md`} />
        <div className={`${block} mt-4 h-4 w-full max-w-sm`} />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex h-[76px] items-center gap-4 rounded-2xl border border-line bg-surface p-4 sm:h-[86px]">
            <div className={`${block} h-11 w-11 rounded-xl`} />
            <div className="flex-1 space-y-2">
              <div className={`${block} h-5 w-14`} />
              <div className={`${block} h-3 w-20`} />
            </div>
          </div>
        ))}
      </div>
      <div className="h-[132px] rounded-2xl border border-line bg-surface" />
      <GridSkeleton />
    </div>
  );
}
