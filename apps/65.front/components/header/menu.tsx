"use client";

import { config } from "@/config/config";
import { cn } from "@/lib/utils";
import { Category } from "@/model/category.model";
import { useCategories } from "@/queries/categories.queries";
import { ChevronDown, MapPinned, MountainSnow } from "lucide-react";
import Image from "next/image";
import authenticatedImageLoader from "@/lib/authenticated-image-loader";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../ui/button";

const Menu = () => {
  const [categoryHover, setCategoryHover] = useState<Category | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { data: categories, isError, refetch } = useCategories();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (isOpen && !categoryHover && categories?.length) {
      setCategoryHover(categories[0]);
    }
  }, [categories, categoryHover, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOutside = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setCategoryHover(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      setCategoryHover(null);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlurCapture={(event) => {
        const nextFocus = event.relatedTarget;
        if (
          !(nextFocus instanceof Node) ||
          !event.currentTarget.contains(nextFocus)
        ) {
          setIsOpen(false);
          setCategoryHover(null);
        }
      }}
    >
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => {
          setIsOpen((current) => !current);
          setCategoryHover(isOpen ? null : (categories?.[0] ?? null));
        }}
      >
        <MountainSnow aria-hidden="true" />
        Catégories
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-150",
            isOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
      </Button>
      {isOpen ? (
        <div
          id={menuId}
          className="absolute top-[calc(100%+0.625rem)] right-0 z-50 flex w-[min(46rem,calc(100vw-2rem))] gap-3 rounded-xl bg-popover p-3 text-popover-foreground shadow-[0_16px_36px_-16px_oklch(0.12_0.02_155/0.45)] outline outline-1 -outline-offset-1 outline-border"
        >
          {categories ? (
            <nav
              className="flex w-56 shrink-0 flex-col gap-1"
              aria-label="Catégories"
            >
              {categories.map((category) => (
                <Link
                  onMouseEnter={() => setCategoryHover(category)}
                  onFocus={() => setCategoryHover(category)}
                  key={category.id}
                  href={`/categories/${category.id}`}
                  className={cn(
                    "flex min-h-10 items-center rounded-lg px-3 text-sm font-medium outline-none transition-[background-color,color] duration-150 hover:bg-secondary hover:text-primary-dark focus-visible:ring-[3px] focus-visible:ring-ring/20",
                    {
                      "bg-secondary text-primary-dark":
                        categoryHover?.id === category.id,
                    },
                  )}
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          ) : isError ? (
            <div className="flex w-56 flex-col items-start justify-center gap-3 px-3">
              <p className="text-sm text-muted-foreground">
                Navigation indisponible.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="min-h-10 rounded-lg text-sm font-semibold text-primary-dark outline-none hover:underline focus-visible:ring-2"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <div
              className="w-56 space-y-2"
              role="status"
              aria-label="Chargement des catégories"
            >
              <div className="skeleton h-10 rounded-lg" />
              <div className="skeleton h-10 rounded-lg" />
              <div className="skeleton h-10 rounded-lg" />
            </div>
          )}
          {categoryHover ? (
            <div
              className={cn("min-h-64 flex-1 rounded-lg bg-muted p-2", {
                "grid grid-cols-2 gap-2": categoryHover.states.length > 0,
              })}
            >
              {(categoryHover?.states ?? []).length > 0 ? (
                (categoryHover?.states ?? []).map((state) => (
                  <Link
                    key={state.id}
                    href={`/categories/${categoryHover?.id}/states/${state.id}`}
                    className="group relative min-h-28 overflow-hidden rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
                  >
                    <Image
                      loader={authenticatedImageLoader}
                      src={`${config.IMAGE_URL}?path=${state.image_path}&rotate=0`}
                      alt={state.name}
                      width={270}
                      height={160}
                      className="h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/10 transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
                    />
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-3">
                      <p className="text-sm font-semibold text-white">
                        {state.name}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <Link
                  href={`/categories/${categoryHover?.id}`}
                  className="group relative block h-full min-h-64 overflow-hidden rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
                >
                  <Image
                    loader={authenticatedImageLoader}
                    src={`${config.IMAGE_URL}?path=${categoryHover?.image_path}&rotate=0`}
                    alt={categoryHover?.name ?? ""}
                    width={600}
                    height={800}
                    className="absolute inset-0 h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/10 transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
                  />
                  <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/65 p-4 text-sm font-semibold text-white">
                    <MapPinned className="size-4" aria-hidden="true" />
                    Voir toutes les activités
                  </span>
                </Link>
              )}
            </div>
          ) : (
            <div
              className="skeleton min-h-64 flex-1 rounded-lg"
              aria-hidden="true"
            />
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Menu;
