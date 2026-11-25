import { Suspense } from "react";
import HikeInformation from "./hikeInformation";
import HikePageSkeleton from "./hikePageSkeleton";

export default function HikePage() {
  return (
    <div className="flex min-h-[60vh] flex-1 flex-col bg-background py-3 sm:py-6 lg:py-8">
      <Suspense fallback={<HikePageSkeleton />}>
        <HikeInformation />
      </Suspense>
    </div>
  );
}
