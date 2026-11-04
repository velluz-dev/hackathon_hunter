const block = "animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800";
const surface = "border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900";

export function CardSkeleton() {
  return (
    <div className={`flex h-[236px] flex-col rounded-2xl p-4 ${surface}`}>
      <div className="flex gap-3">
        <div className={`${block} h-12 w-12 rounded-xl`} />
        <div className="flex-1 space-y-2 pt-1">
          <div className={`${block} h-2.5 w-1/3`} />
          <div className={`${block} h-4 w-4/5`} />
        </div>
      </div>
      <div className={`${block} mt-4 h-3 w-2/5`} />
      <div className={`${block} mt-2 h-3 w-1/2`} />
      <div className="mt-4 flex gap-2">
        <div className={`${block} h-5 w-24 rounded-full`} />
        <div className={`${block} h-5 w-14 rounded-full`} />
      </div>
    </div>
  );
}

/** Placeholder for the whole Browse page while listings load. */
export function BrowseSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading hackathons">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`flex h-[62px] items-center gap-3 rounded-xl px-4 sm:h-[72px] ${surface}`}>
            <div className={`${block} h-9 w-9`} />
            <div className="flex-1 space-y-1.5">
              <div className={`${block} h-4 w-12`} />
              <div className={`${block} h-2.5 w-20`} />
            </div>
          </div>
        ))}
      </div>
      <div className={`h-[116px] rounded-2xl ${surface}`} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
