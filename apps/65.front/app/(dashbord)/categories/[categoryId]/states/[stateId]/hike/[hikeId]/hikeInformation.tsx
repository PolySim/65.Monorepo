"use client";

import { useHikeById } from "@/queries/hike.queries";
import { Loader2 } from "lucide-react";
import HikeDescription from "./hikeDescription";
import HikeGlobalInformation from "./hikeGlobalInformation";
import HikeGPXContainer from "./hikeGPXContainer";
import HikeHeader from "./hikeHeader";
import HikePhoto from "./hikePhoto";

const HikeInformation = () => {
  const { data: hike, isPending } = useHikeById();

  return isPending ? (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ) : (
    <div className="w-11/12 max-w-6xl mx-auto rounded-lg bg-white overflow-hidden shadow">
      <HikeHeader hike={hike!} />
      <HikeGlobalInformation hike={hike!} />
      <HikeDescription hike={hike!} />
      <HikePhoto hike={hike!} />
      <HikeGPXContainer hike={hike!} />
    </div>
  );
};

export default HikeInformation;
