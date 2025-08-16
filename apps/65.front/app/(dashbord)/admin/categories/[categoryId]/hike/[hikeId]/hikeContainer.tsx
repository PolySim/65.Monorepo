"use client";

import { useHikeById } from "@/queries/hike.queries";
import { Loader2 } from "lucide-react";
import HikeHeader from "./hikeHeader";

export default function HikeContainer() {
  const { isPending } = useHikeById();

  return isPending ? (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ) : (
    <div className="w-11/12 max-w-6xl mx-auto rounded-lg bg-white overflow-hidden shadow">
      <HikeHeader />
      {/*<HikeGlobalInformation hike={hike!} />
      <HikeDescription hike={hike!} />
      <HikePhoto hike={hike!} />
      <HikeGPXContainer hike={hike!} /> */}
    </div>
  );
}
