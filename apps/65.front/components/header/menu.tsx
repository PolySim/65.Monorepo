"use client";

import { config } from "@/config/config";
import authenticatedImageLoader from "@/lib/authenticated-image-loader";
import { cn } from "@/lib/utils";
import { useCategories } from "@/queries/categories.queries";
import { ChevronDown, MountainSnow } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../ui/button";

const Menu = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { data: categories, isPending, isError, refetch } = useCategories();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const close = () => {
    setIsOpen(false);
    setActiveId(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    const closeOutside = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };

    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onKeyDown={(event) => {
        if (isOpen && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          triggerRef.current?.focus();
          close();
        }
      }}
    >
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
      >
        <MountainSnow aria-hidden="true" />
        Catégories
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform",
            isOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
      </Button>
      <nav
        id={menuId}
        aria-label="Catégories"
        hidden={!isOpen}
        className="absolute top-[calc(100%+0.625rem)] right-0 z-50 w-[min(46rem,calc(100vw-2rem))] rounded-xl bg-popover p-3 text-popover-foreground shadow-[0_16px_36px_-16px_oklch(0.12_0.02_155/0.45)] outline outline-1 -outline-offset-1 outline-border"
      >
        {isOpen &&
          (isPending ? (
            <div
              className="w-56 space-y-2"
              role="status"
              aria-label="Chargement des catégories"
            >
              <div className="skeleton h-10 rounded-lg" />
              <div className="skeleton h-10 rounded-lg" />
              <div className="skeleton h-10 rounded-lg" />
            </div>
          ) : isError ? (
            <div className="space-y-3 px-3">
              <p className="text-sm text-muted-foreground">
                Navigation indisponible.
              </p>
              <Button type="button" variant="outline" onClick={() => refetch()}>
                Réessayer
              </Button>
            </div>
          ) : categories?.length ? (
            <ul className="max-h-[min(65vh,28rem)] min-h-64 w-56 overflow-y-auto">
              <li
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-3 right-3 left-62 rounded-lg bg-muted"
              />
              {categories.map((category) => {
                const states = category.states ?? [];
                const expanded = activeId === category.id;
                const panelId = `${menuId}-${category.id}`;

                return (
                  <li key={category.id}>
                    <div
                      className={cn(
                        "mb-1 flex items-center gap-1 rounded-lg",
                        expanded && "bg-secondary",
                      )}
                    >
                      <Link
                        onClick={close}
                        href={`/categories/${category.id}`}
                        className="flex min-h-10 min-w-0 flex-1 items-center rounded-lg px-3 text-sm font-medium outline-none hover:bg-secondary hover:text-primary-dark focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        {category.name}
                      </Link>
                      {states.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Massifs : ${category.name}`}
                          aria-expanded={expanded}
                          aria-controls={panelId}
                          onClick={() =>
                            setActiveId(expanded ? null : category.id)
                          }
                        >
                          <ChevronDown
                            aria-hidden="true"
                            className={cn(expanded && "-rotate-90")}
                          />
                        </Button>
                      )}
                    </div>
                    {states.length > 0 && (
                      <div
                        id={panelId}
                        hidden={!expanded}
                        className="absolute inset-y-3 right-3 left-62 overflow-y-auto rounded-lg bg-muted p-2"
                      >
                        {expanded && (
                          <ul className="grid grid-cols-2 gap-2">
                            {states.map((state) => (
                              <li key={state.id}>
                                <Link
                                  onClick={close}
                                  href={`/categories/${category.id}/states/${state.id}`}
                                  className="group relative flex min-h-28 items-end overflow-hidden rounded-lg bg-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  {state.image_path && (
                                    <Image
                                      loader={authenticatedImageLoader}
                                      src={`${config.IMAGE_URL}?path=${state.image_path}&rotate=0`}
                                      alt=""
                                      fill
                                      sizes="250px"
                                      className="object-cover transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transform-none"
                                    />
                                  )}
                                  <span className="relative w-full bg-gradient-to-t from-black/75 to-transparent p-3 text-sm font-semibold text-white">
                                    {state.name}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-3 text-sm text-muted-foreground">
              Aucune catégorie disponible.
            </p>
          ))}
      </nav>
    </div>
  );
};

export default Menu;
