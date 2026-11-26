import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Suspense } from "react";
import { hikeDetailKey } from "./hikeDetail.model";
import HikeInformation, { HikeUnavailable } from "./hikeInformation";
import HikePageSkeleton from "./hikePageSkeleton";
import { readHikeDetail } from "./readHikeDetail";

type Props = { params: Promise<{ hikeId: string }> };

async function HikeDetailRoute({ params }: Props) {
  const { hikeId } = await params;
  const result = await readHikeDetail(hikeId);
  if (result.status !== "ready") {
    return <HikeUnavailable missing={result.status === "missing"} />;
  }

  // Only this request's detail snapshot is serialized into the account provider.
  const queryClient = new QueryClient();
  queryClient.setQueryData(hikeDetailKey(hikeId), result.hike);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HikeInformation />
    </HydrationBoundary>
  );
}

export default function HikePage({ params }: Props) {
  return (
    <div className="flex min-h-[60vh] flex-1 flex-col bg-background py-3 sm:py-6 lg:py-8">
      <Suspense fallback={<HikePageSkeleton />}>
        <HikeDetailRoute params={params} />
      </Suspense>
    </div>
  );
}
