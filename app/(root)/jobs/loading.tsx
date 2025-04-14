// app/(root)/jobs/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

const Loading = () => {
  return (
    <section>
      <h1 className="h1-bold text-dark100_light900">Jobs</h1>

      {/* Search Bars Skeleton */}
      <div className="mt-11 flex flex-col gap-5 sm:flex-row sm:items-center">
        <Skeleton className="h-14 flex-1" />
        <Skeleton className="h-14 w-full sm:w-60" />
      </div>

      {/* Job Cards Skeleton */}
      <div className="mt-10 flex flex-col gap-6">
        {[1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} className="h-48 w-full rounded-xl" />
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="mt-10 flex w-full items-center justify-center gap-2">
         <Skeleton className="h-9 w-20 rounded-md" />
         <Skeleton className="h-9 w-10 rounded-md" />
         <Skeleton className="h-9 w-20 rounded-md" />
      </div>
    </section>
  );
};

export default Loading;