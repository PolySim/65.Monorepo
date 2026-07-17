import { Suspense } from "react";
import HikeInformation from "./hikeInformation";

const HikePageSkeleton = () => (
  <div
    className="page-container"
    role="status"
    aria-live="polite"
    aria-label="Chargement de la randonnée"
  >
    <span className="sr-only">Chargement de la randonnée…</span>
    <div aria-hidden="true" className="space-y-4">
      <div className="skeleton h-[28rem] rounded-xl sm:h-[32rem] lg:h-[36rem]" />
      <div className="surface grid gap-px overflow-hidden sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex min-h-24 items-center gap-4 p-5">
            <div className="skeleton size-11 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-5 w-28 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function HikePage() {
  return (
    <div className="flex min-h-[60vh] flex-1 flex-col bg-background py-4 sm:py-6 lg:py-10">
      <Suspense fallback={<HikePageSkeleton />}>
        <HikeInformation />
      </Suspense>
    </div>
  );
}
