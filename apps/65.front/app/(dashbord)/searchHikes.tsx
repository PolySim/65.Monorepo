"use client";

import { useHikeFilters } from "@/queries/hike.queries";
import { ArrowUpRight, MapPin, Search, X } from "lucide-react";
import Link from "next/link";
import { FocusEvent, useDeferredValue, useId, useState } from "react";

const SearchHikes = () => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const deferredSearch = useDeferredValue(search.trim());
  const resultsId = useId();
  const shouldSearch = deferredSearch.length >= 2;
  const {
    data: hikes,
    isPending,
    isError,
    refetch,
  } = useHikeFilters({
    title: shouldSearch ? deferredSearch : "",
  });

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false);
    }
  };

  const showResults = isOpen && search.trim().length >= 2;

  return (
    <div
      className="relative"
      onFocusCapture={() => setIsOpen(true)}
      onBlurCapture={handleBlur}
    >
      <form role="search" onSubmit={(event) => event.preventDefault()}>
        <label
          htmlFor="home-search"
          className="mb-2 block text-sm font-semibold text-white"
        >
          Rechercher une activité
        </label>
        <div className="flex min-h-14 items-center gap-3 rounded-xl bg-white px-4 text-foreground shadow-[0_6px_8px_-6px_oklch(0.12_0.02_155/0.35)] focus-within:ring-[3px] focus-within:ring-white/35">
          <Search className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <input
            id="home-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom, massif ou type d’activité…"
            autoComplete="off"
            aria-controls={resultsId}
            aria-expanded={showResults}
            className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-[background-color,color,scale] duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/20 active:scale-[0.96]"
              aria-label="Effacer la recherche"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </form>

      {showResults ? (
        <div
          id={resultsId}
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 max-h-80 overflow-y-auto rounded-xl bg-popover p-2 text-popover-foreground shadow-[0_16px_36px_-16px_oklch(0.12_0.02_155/0.45)]"
          aria-live="polite"
        >
          {isPending || deferredSearch !== search.trim() ? (
            <div className="space-y-2 p-2" role="status">
              <span className="sr-only">Recherche en cours</span>
              <div className="skeleton h-14 rounded-lg" />
              <div className="skeleton h-14 rounded-lg" />
              <div className="skeleton h-14 rounded-lg" />
            </div>
          ) : isError ? (
            <div className="flex min-h-28 flex-col items-center justify-center gap-3 px-4 text-center">
              <p className="text-sm text-muted-foreground">
                La recherche est momentanément indisponible.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="min-h-10 rounded-lg px-3 text-sm font-semibold text-primary-dark outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/20"
              >
                Réessayer
              </button>
            </div>
          ) : (hikes ?? []).length > 0 ? (
            <ul className="space-y-1">
              {(hikes ?? []).map((hike) => (
                <li key={hike.id}>
                  <Link
                    href={`/categories/${hike.category.id}/states/${hike.state.id}/hike/${hike.id}`}
                    className="group flex min-h-14 items-center gap-3 rounded-lg px-3 py-2 outline-none transition-colors duration-150 hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/20"
                  >
                    <MapPin
                      className="size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-foreground">
                        {hike.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {hike.state.name} · {hike.category.name}
                      </span>
                    </span>
                    <ArrowUpRight
                      className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex min-h-28 items-center justify-center px-5 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune activité ne correspond à « {deferredSearch} ».
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default SearchHikes;
