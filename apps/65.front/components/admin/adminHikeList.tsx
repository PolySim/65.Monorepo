"use client";

import { getDifficultyColor } from "@/components/hikes/hikeElement";
import { Button } from "@/components/ui/button";
import { config } from "@/config/config";
import authenticatedImageLoader from "@/lib/authenticated-image-loader";
import { HikeSearch } from "@/model/hike.model";
import { useHikeFilters } from "@/queries/hike.queries";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  ImageIcon,
  MapPin,
  Mountain,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useMemo, useRef, useState } from "react";

type CompletenessFilter = "all" | "incomplete";

const normalizeSearch = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getEssentialStatus = (hike: HikeSearch) => [
  {
    key: "image",
    label: "Image",
    complete: Boolean(hike.mainImage?.path),
  },
  {
    key: "distance",
    label: "Distance",
    complete:
      typeof hike.distance === "number" &&
      Number.isFinite(hike.distance) &&
      hike.distance > 0,
  },
  {
    key: "duration",
    label: "Durée",
    complete: Boolean(hike.duration?.trim()),
  },
  {
    key: "elevation",
    label: "Dénivelé",
    complete:
      typeof hike.elevation === "number" &&
      Number.isFinite(hike.elevation) &&
      hike.elevation >= 0,
  },
];

const HikeListSkeleton = () => (
  <div className="divide-y divide-border" role="status">
    <span className="sr-only">Chargement des activités</span>
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="grid min-h-24 grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-3 px-4 py-3 sm:grid-cols-[4rem_minmax(0,1fr)_13rem] sm:px-5"
      >
        <div className="skeleton size-[3.75rem] rounded-lg sm:size-16" />
        <div className="space-y-2">
          <div className="skeleton h-5 w-2/3 rounded" />
          <div className="skeleton h-4 w-1/3 rounded" />
        </div>
        <div className="hidden space-y-2 sm:block">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-4 w-full rounded" />
        </div>
      </div>
    ))}
  </div>
);

const EssentialStatus = ({ hike }: { hike: HikeSearch }) => {
  const statuses = getEssentialStatus(hike);
  const completedCount = statuses.filter((item) => item.complete).length;
  const isComplete = completedCount === statuses.length;

  return (
    <div className="min-w-0">
      <p
        className={`text-xs font-semibold tabular-nums ${
          isComplete ? "text-primary-dark" : "text-accent-foreground"
        }`}
      >
        {completedCount}/4 essentiels
      </p>
      <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1">
        {statuses.map((status) => (
          <span
            key={status.key}
            className={`flex items-center gap-1 text-xs ${
              status.complete ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {status.complete ? (
              <CheckCircle2
                className="size-3.5 text-primary"
                aria-hidden="true"
              />
            ) : (
              <Circle className="size-3.5 text-sunrise" aria-hidden="true" />
            )}
            <span className="sr-only">
              {status.complete ? "Renseigné" : "Manquant"} :
            </span>
            {status.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default function AdminHikeList() {
  const { data: hikes, isPending, isError, refetch } = useHikeFilters();
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [completeness, setCompleteness] = useState<CompletenessFilter>("all");
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = normalizeSearch(deferredSearch);

  const visibleHikes = useMemo(() => {
    return (hikes ?? []).filter((hike) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        normalizeSearch(
          [hike.title, hike.state?.name, hike.difficulty?.name]
            .filter(Boolean)
            .join(" "),
        ).includes(normalizedSearch);
      const hasIncompleteEssentials = getEssentialStatus(hike).some(
        (item) => !item.complete,
      );

      return (
        matchesSearch && (completeness === "all" || hasIncompleteEssentials)
      );
    });
  }, [completeness, hikes, normalizedSearch]);

  const hasActiveFilters = search.trim().length > 0 || completeness !== "all";
  const resultLabel = `${visibleHikes.length} activité${
    visibleHikes.length === 1 ? "" : "s"
  } affichée${visibleHikes.length === 1 ? "" : "s"}`;

  const resetFilters = () => {
    setSearch("");
    setCompleteness("all");
  };

  return (
    <section
      className="surface overflow-hidden"
      aria-labelledby="hike-list-title"
    >
      <div className="border-b border-border p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="hike-list-title" className="font-bold">
              Activités de la catégorie
            </h2>
            <p
              id="admin-hike-results-count"
              className="mt-1 text-sm text-muted-foreground tabular-nums"
              aria-live="polite"
              aria-atomic="true"
            >
              {isPending
                ? "Chargement des activités…"
                : isError
                  ? "Résultats indisponibles"
                  : resultLabel}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-72">
              <label htmlFor="admin-hike-search" className="sr-only">
                Rechercher dans les activités de cette catégorie
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                id="admin-hike-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une activité…"
                autoComplete="off"
                aria-describedby="admin-hike-results-count"
                className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-11 text-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground focus:border-primary focus:ring-[3px] focus:ring-ring/20"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    requestAnimationFrame(() =>
                      searchInputRef.current?.focus(),
                    );
                  }}
                  className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/20"
                  aria-label="Effacer la recherche"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>

            <label htmlFor="admin-hike-completeness" className="sr-only">
              Filtrer selon les informations essentielles
            </label>
            <select
              id="admin-hike-completeness"
              value={completeness}
              onChange={(event) =>
                setCompleteness(event.target.value as CompletenessFilter)
              }
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-medium outline-none transition-[border-color,box-shadow] duration-150 focus:border-primary focus:ring-[3px] focus:ring-ring/20"
            >
              <option value="all">Toutes les activités</option>
              <option value="incomplete">Essentiels manquants</option>
            </select>
          </div>
        </div>
      </div>

      {isPending ? (
        <HikeListSkeleton />
      ) : isError ? (
        <div
          className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center"
          role="alert"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-sunrise-soft text-accent-foreground">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <h3 className="mt-4 font-semibold">Activités indisponibles</h3>
          <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            Vérifiez votre connexion, puis relancez le chargement de cette
            catégorie.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => void refetch()}
          >
            <RefreshCw aria-hidden="true" />
            Réessayer
          </Button>
        </div>
      ) : visibleHikes.length > 0 ? (
        <ul
          className="divide-y divide-border"
          aria-busy={search !== deferredSearch}
        >
          {visibleHikes.map((hike) => (
            <li key={hike.id} className="[content-visibility:auto]">
              <Link
                href={`/admin/categories/${hike.category.id}/hike/${hike.id}`}
                className="group grid min-h-24 grid-cols-[3.75rem_minmax(0,1fr)_2.75rem] items-center gap-x-3 gap-y-2 px-4 py-3 outline-none transition-colors duration-150 hover:bg-muted/60 focus-visible:bg-secondary focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/25 sm:grid-cols-[4rem_minmax(0,1fr)_minmax(13rem,auto)_2.75rem] sm:px-5"
              >
                <div className="relative row-span-2 size-[3.75rem] overflow-hidden rounded-lg bg-secondary outline outline-1 -outline-offset-1 outline-black/10 sm:row-span-1 sm:size-16">
                  {hike.mainImage?.path ? (
                    <Image
                      loader={authenticatedImageLoader}
                      src={`${config.IMAGE_URL}?path=${hike.mainImage.path}&rotate=${hike.mainImage.rotate ?? 0}`}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-primary">
                      <ImageIcon className="size-5" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-foreground">
                    {hike.title || "Activité sans nom"}
                    <span className="sr-only">, modifier l’activité</span>
                  </h3>
                  <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
                    <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                      <MapPin
                        className="size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {hike.state?.name || "Massif non renseigné"}
                      </span>
                    </span>
                    {hike.difficulty?.name ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getDifficultyColor(hike.difficulty.id)}`}
                      >
                        {hike.difficulty.name}
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Difficulté manquante
                      </span>
                    )}
                  </div>
                </div>

                <div className="col-start-2 col-end-4 row-start-2 sm:col-start-3 sm:col-end-4 sm:row-start-1">
                  <EssentialStatus hike={hike} />
                </div>

                <ArrowRight
                  className="col-start-3 row-start-1 size-4 justify-self-center text-primary transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none sm:col-start-4"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary-dark">
            {hasActiveFilters ? (
              <Search className="size-5" aria-hidden="true" />
            ) : (
              <Mountain className="size-5" aria-hidden="true" />
            )}
          </span>
          <h3 className="mt-4 font-semibold">
            {hasActiveFilters
              ? "Aucune activité ne correspond"
              : "Aucune activité dans cette catégorie"}
          </h3>
          <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            {hasActiveFilters
              ? "Modifiez la recherche ou affichez toutes les activités pour retrouver un itinéraire."
              : "Créez la première activité avec le bouton situé en haut de la page."}
          </p>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={resetFilters}
            >
              <RotateCcw aria-hidden="true" />
              Réinitialiser les filtres
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
