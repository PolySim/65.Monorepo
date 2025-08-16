"use client";

import { useHikeFavorites, useHikeFilters } from "@/queries/hike.queries";
import { Loader2 } from "lucide-react";
import EmptyHikes from "./emptyHikes";
import HikeElement from "./hikeElement";

const GridHikes = (props: { isFavorites?: boolean; isAdmin?: boolean }) => {
  const { data: hikesFilters, isPending: isPendingFilters } = useHikeFilters();
  const { data: hikesFavorites, isPending: isPendingFavorites } =
    useHikeFavorites(props.isFavorites);

  const hikes = props.isFavorites ? hikesFavorites : hikesFilters;
  const isPending = props.isFavorites ? isPendingFavorites : isPendingFilters;

  return isPending ? (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ) : hikes && hikes.length > 0 ? (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-4">
      {hikes.map((hike) => (
        <HikeElement key={hike.id} hike={hike} isAdmin={props.isAdmin} />
      ))}
    </div>
  ) : (
    <EmptyHikes />
  );
};

export default GridHikes;
