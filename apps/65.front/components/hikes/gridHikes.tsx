"use client";

import { Button } from "@/components/ui/button";
import { useAppParams } from "@/hook/useAppParams";
import { useHikeFavorites, useHikeFilters } from "@/queries/hike.queries";
import { AlertTriangle, RefreshCw } from "lucide-react";
import EmptyHikes from "./emptyHikes";
import HikeElement from "./hikeElement";

const gridClassName =
  "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-x-8";

const HikeGridSkeleton = () => (
  <div className={gridClassName} role="status">
    <span className="sr-only">Chargement des activités</span>
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        aria-hidden="true"
        className="overflow-hidden rounded-md border border-border bg-card"
      >
        <div className="skeleton aspect-[16/10]" />
        <div className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4">
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton mt-1.5 h-[1.5625rem] w-3/4 rounded" />
          <div className="mt-4 border-t border-border pt-3">
            <div className="skeleton h-5 w-1/2 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const GridHikes = (props: { isFavorites?: boolean; isAdmin?: boolean }) => {
  const { categoryId, stateId } = useAppParams();
  const filtersQuery = useHikeFilters();
  const favoritesQuery = useHikeFavorites(props.isFavorites);
  const query = props.isFavorites ? favoritesQuery : filtersQuery;
  const hikes = query.data;

  if (query.isPending) return <HikeGridSkeleton />;

  if (query.isError) {
    return (
      <div
        className="flex min-h-72 rounded-md border border-border bg-card flex-col items-center justify-center px-6 py-10 text-center"
        role="alert"
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-sunrise-soft text-accent-foreground">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-lg font-bold">
          {props.isFavorites
            ? "Impossible de charger vos favoris"
            : "Impossible de charger les activités"}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Vérifiez votre connexion puis relancez le chargement.
        </p>
        <Button
          className="mt-5 min-h-11"
          variant="outline"
          disabled={query.isFetching}
          onClick={() => query.refetch()}
        >
          <RefreshCw aria-hidden="true" />
          {query.isFetching ? "Chargement…" : "Réessayer"}
        </Button>
      </div>
    );
  }

  return hikes && hikes.length > 0 ? (
    <div className={gridClassName}>
      {hikes.map((hike, index) => (
        <HikeElement
          key={hike.id}
          hike={hike}
          isAdmin={props.isAdmin}
          priority={index === 0}
        />
      ))}
    </div>
  ) : (
    <EmptyHikes
      isFavorites={props.isFavorites}
      isAdmin={props.isAdmin}
      categoryHref={
        !props.isFavorites && !props.isAdmin && categoryId && stateId
          ? `/categories/${encodeURIComponent(categoryId)}`
          : undefined
      }
    />
  );
};

export default GridHikes;
