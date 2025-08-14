"use client";

import { useHikeFilters } from "@/queries/hike.queries";
import { Loader2 } from "lucide-react";
import HikeElement from "./hikeElement";

const GridHikes = () => {
  const { data: hikes, isPending } = useHikeFilters();

  return isPending ? (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ) : (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-4">
      {hikes?.map((hike) => (
        <HikeElement key={hike.id} hike={hike} />
      ))}
    </div>
  );
};

export default GridHikes;
