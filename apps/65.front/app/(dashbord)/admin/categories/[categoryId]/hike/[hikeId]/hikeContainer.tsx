"use client";

import { useHikeById } from "@/queries/hike.queries";
import { Loader2 } from "lucide-react";
import HikeDescription from "./hikeDescription";
import HikeGlobalInformation from "./hikeGlobalInformation";
import HikeHeader from "./hikeHeader";
import dynamic from "next/dynamic";
import HikeGPXContainer from "./hikeGPXContainer";

const HikePhoto = dynamic(() => import("./hikePhoto"), { ssr: false });

export default function HikeContainer() {
  const { isPending } = useHikeById();

  return isPending ? (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ) : (
    <div className="w-11/12 max-w-6xl mx-auto rounded-lg bg-white overflow-hidden shadow">
      <HikeHeader />
      <HikeGlobalInformation />
      <HikeDescription />
      <HikePhoto />
      <HikeGPXContainer />
    </div>
  );
}
