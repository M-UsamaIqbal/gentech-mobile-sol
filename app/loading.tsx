export default function Loading() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-12" aria-busy="true">
      <div className="bg-muted h-8 w-48 animate-pulse rounded-lg" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="surface-flat overflow-hidden rounded-2xl">
            <div className="bg-muted aspect-4/3 animate-pulse" />
            <div className="space-y-3 p-4">
              <div className="bg-muted h-4 w-3/4 animate-pulse rounded-md" />
              <div className="bg-muted h-4 w-1/2 animate-pulse rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
