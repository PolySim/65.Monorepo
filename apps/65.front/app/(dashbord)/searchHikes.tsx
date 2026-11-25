"use client";

import {
  HIKE_SUGGESTION_MAX_LENGTH,
  type HikeSuggestion,
} from "@/model/hike.model";
import { useHikeSuggestions } from "@/queries/hike.queries";
import { ArrowUpRight, MapPin, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FocusEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

const SEARCH_DELAY_MS = 250;

const suggestionHref = (hike: HikeSuggestion) =>
  `/categories/${encodeURIComponent(hike.categoryId)}/states/${encodeURIComponent(hike.stateId)}/hike/${encodeURIComponent(hike.id)}`;

const SearchHikes = () => {
  const [search, setSearch] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsId = useId();
  const router = useRouter();
  const term = search.trim();
  const showResults = isOpen && term.length >= 2;
  const isDebouncing = term !== debouncedTerm;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(term), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [term]);

  const { data, isPending, isError, refetch } = useHikeSuggestions(
    debouncedTerm,
    showResults && !isDebouncing,
  );
  const isLoading = isDebouncing || isPending;
  const hikes = !isLoading && !isError ? (data ?? []) : [];
  const activeHike = hikes[activeIndex];
  const activeOptionId =
    showResults && activeHike ? `${resultsId}-${activeIndex}` : undefined;

  useEffect(() => {
    if (activeOptionId) {
      document
        .getElementById(activeOptionId)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [activeOptionId]);

  const closeResults = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) closeResults();
  };

  const changeSearch = (value: string) => {
    if (value.trim() !== term) setDebouncedTerm("");
    setSearch(value);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" && showResults && activeHike) {
      event.preventDefault();
      closeResults();
      router.push(suggestionHref(activeHike));
      return;
    }
    if (
      (event.key !== "ArrowDown" && event.key !== "ArrowUp") ||
      term.length < 2
    )
      return;

    event.preventDefault();
    setIsOpen(true);
    if (!hikes.length) return;

    const next =
      event.key === "ArrowDown"
        ? (activeIndex + 1) % hikes.length
        : activeIndex <= 0
          ? hikes.length - 1
          : activeIndex - 1;
    setActiveIndex(next);
  };

  return (
    <div
      className="relative"
      onFocusCapture={() => setIsOpen(true)}
      onBlurCapture={handleBlur}
      onKeyDown={(event) => {
        if (
          event.key === "Escape" &&
          showResults &&
          !event.nativeEvent.isComposing
        ) {
          event.preventDefault();
          inputRef.current?.focus();
          closeResults();
        }
      }}
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
            ref={inputRef}
            type="search"
            role="combobox"
            value={search}
            maxLength={HIKE_SUGGESTION_MAX_LENGTH}
            onChange={(event) => changeSearch(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            onClick={() => setIsOpen(true)}
            placeholder="Nom, massif ou type d’activité…"
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={showResults ? resultsId : undefined}
            aria-expanded={showResults}
            aria-activedescendant={activeOptionId}
            className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                changeSearch("");
                inputRef.current?.focus();
              }}
              className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-[background-color,color,scale] duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/20 active:scale-[0.96]"
              aria-label="Effacer la recherche"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </form>

      {showResults ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 max-h-80 overflow-y-auto rounded-xl bg-popover p-2 text-popover-foreground shadow-[0_16px_36px_-16px_oklch(0.12_0.02_155/0.45)]">
          {isLoading ? (
            <div className="space-y-2 p-2" role="status">
              <span className="sr-only">Recherche en cours</span>
              <div className="skeleton h-14 rounded-lg" />
              <div className="skeleton h-14 rounded-lg" />
              <div className="skeleton h-14 rounded-lg" />
            </div>
          ) : isError ? (
            <div className="flex min-h-28 flex-col items-center justify-center gap-3 px-4 text-center">
              <p className="text-sm text-muted-foreground" role="status">
                La recherche est momentanément indisponible.
              </p>
              <button
                type="button"
                onClick={() => {
                  inputRef.current?.focus();
                  void refetch();
                }}
                className="min-h-10 rounded-lg px-3 text-sm font-semibold text-primary-dark outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/20"
              >
                Réessayer
              </button>
            </div>
          ) : hikes.length === 0 ? (
            <div
              className="flex min-h-28 items-center justify-center px-5 text-center"
              role="status"
            >
              <p className="text-sm text-muted-foreground">
                Aucune activité ne correspond à « {debouncedTerm} ».
              </p>
            </div>
          ) : (
            <span className="sr-only" role="status">
              {hikes.length} {hikes.length === 1 ? "suggestion" : "suggestions"}
            </span>
          )}
          <ul
            id={resultsId}
            role="listbox"
            aria-label="Suggestions d’activités"
            aria-busy={isLoading}
            className="space-y-1"
          >
            {hikes.map((hike, index) => (
              <li key={hike.id} role="presentation">
                <Link
                  href={suggestionHref(hike)}
                  prefetch={false}
                  id={`${resultsId}-${index}`}
                  role="option"
                  tabIndex={-1}
                  aria-selected={index === activeIndex}
                  onNavigate={closeResults}
                  className="group flex min-h-14 items-center gap-3 rounded-lg px-3 py-2 outline-none transition-colors duration-150 hover:bg-secondary aria-selected:bg-secondary"
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
                      {hike.stateName} · {hike.categoryName}
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
        </div>
      ) : null}
    </div>
  );
};

export default SearchHikes;
