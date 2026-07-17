"use client";

import { Button } from "@/components/ui/button";
import { useHikeFavorites, useHikeFilters } from "@/queries/hike.queries";
import { AlertTriangle, RefreshCw } from "lucide-react";
import EmptyHikes from "./emptyHikes";
import HikeElement from "./hikeElement";

const HikeGridSkeleton = () => (
  <div
    className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    role="status"
  >
    <span className="sr-only">Chargement des activités</span>
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="surface overflow-hidden">
        <div className="skeleton aspect-[16/10]" />
        <div className="space-y-3 p-5">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-6 w-3/4 rounded" />
          <div className="skeleton h-4 w-2/5 rounded" />
          <div className="skeleton mt-5 h-10 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

const GridHikes = (props: { isFavorites?: boolean; isAdmin?: boolean }) => {
  const filtersQuery = useHikeFilters();
  const favoritesQuery = useHikeFavorites(props.isFavorites);
  const query = props.isFavorites ? favoritesQuery : filtersQuery;
  const hikes = query.data;

  if (query.isPending) return <HikeGridSkeleton />;

  if (query.isError) {
    return (
      <div
        className="surface flex min-h-72 flex-col items-center justify-center px-6 py-10 text-center"
        role="alert"
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-sunrise-soft text-accent-foreground">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-lg font-bold">
          Impossible de charger les activités
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Vérifiez votre connexion puis relancez le chargement.
        </p>
        <Button
          className="mt-5"
          variant="outline"
          onClick={() => query.refetch()}
        >
          <RefreshCw aria-hidden="true" />
          Réessayer
        </Button>
      </div>
    );
  }

  return hikes && hikes.length > 0 ? (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {hikes.map((hike) => (
        <HikeElement key={hike.id} hike={hike} isAdmin={props.isAdmin} />
      ))}
    </div>
  ) : (
    <EmptyHikes isFavorites={props.isFavorites} isAdmin={props.isAdmin} />
  );
};

export default GridHikes;
