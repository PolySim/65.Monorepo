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

function MassifPhoto({ src, eager }: { src?: string | null; eager: boolean }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="relative grid aspect-[8/5] place-items-center bg-secondary text-primary-dark">
      <MountainSnow className="size-5" aria-hidden="true" />
      {src && !failed && (
        <Image
          loader={authenticatedImageLoader}
          src={src}
          alt=""
          fill
          sizes="160px"
          loading={eager ? "eager" : "lazy"}
          onError={() => setFailed(true)}
          className="object-cover"
        />
      )}
    </span>
  );
}

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
        className="absolute top-[calc(100%+0.625rem)] right-0 z-50 max-h-[min(65vh,28rem)] w-88 overflow-y-auto rounded-lg border border-border bg-popover p-3 text-popover-foreground"
      >
        {isOpen &&
          (isPending ? (
            <div
              className="space-y-2"
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
            <ul className="divide-y divide-border">
              {categories.map((category) => {
                const states = category.states ?? [];
                const expanded = activeId === category.id;
                const panelId = `${menuId}-${category.id}`;

                return (
                  <li key={category.id} className="py-1 first:pt-0 last:pb-0">
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-md",
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
                            className={cn(expanded && "rotate-180")}
                          />
                        </Button>
                      )}
                    </div>
                    {states.length > 0 && (
                      <div id={panelId} hidden={!expanded} className="py-2">
                        {expanded && (
                          <ul className="grid grid-cols-2 gap-2">
                            {states.map((state, index) => {
                              const src = state.image_path
                                ? `${config.IMAGE_URL}?path=${encodeURIComponent(state.image_path)}&rotate=0`
                                : null;

                              return (
                                <li key={state.id}>
                                  <Link
                                    onClick={close}
                                    href={`/categories/${category.id}/states/${state.id}`}
                                    className="flex h-full flex-col overflow-hidden rounded-md border border-border text-sm font-medium outline-none hover:border-primary hover:underline focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring"
                                  >
                                    <MassifPhoto
                                      key={src}
                                      src={src}
                                      eager={index < 2}
                                    />
                                    <span className="px-2.5 py-2 [overflow-wrap:anywhere]">
                                      {state.name}
                                    </span>
                                  </Link>
                                </li>
                              );
                            })}
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
