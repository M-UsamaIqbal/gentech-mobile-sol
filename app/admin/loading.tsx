import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading admin page">
      <span className="sr-only">Loading admin page…</span>
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-56 max-w-full sm:h-9 sm:w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="space-y-4 rounded-xl border border-white/[0.07] bg-[#1F1F1F] p-4"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-32 max-w-full" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#1F1F1F]">
        <div className="space-y-3 border-b border-white/[0.07] p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
        <div className="divide-y divide-white/[0.06]">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 p-4">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-48 max-w-full" />
                <Skeleton className="h-3 w-32 max-w-full" />
              </div>
              <Skeleton className="h-8 w-16 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
