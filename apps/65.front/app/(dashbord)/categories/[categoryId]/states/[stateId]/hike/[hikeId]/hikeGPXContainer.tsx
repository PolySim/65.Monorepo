"use client";

import { useGpxFile } from "@/queries/gpx.queries";
import { useHikeById } from "@/queries/hike.queries";
import { Loader2 } from "lucide-react";
import HikeGPX from "./hikeGPX";

const HikeGPXContainer = () => {
  const { data: hike } = useHikeById();
  const { data: gpxFile, isPending } = useGpxFile(
    hike?.gpxFiles?.[0]?.path ?? ""
  );

  return hike && hike?.gpxFiles?.length && hike?.gpxFiles?.length > 0 ? (
    isPending ? (
      <div className="p-6 bg-white mt-2 flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    ) : gpxFile ? (
      <HikeGPX gpx={gpxFile} />
    ) : null
  ) : null;
};

export default HikeGPXContainer;
